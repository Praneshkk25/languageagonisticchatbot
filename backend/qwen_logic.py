import os
import torch
import json
import re
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig
)
from peft import PeftModel
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_community.vectorstores import FAISS
from langdetect import detect
import easyocr
from langchain_core.documents import Document
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
BASE_MODEL = "Qwen/Qwen2.5-1.5B-Instruct"  
LORA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qwen-college-bot-lora")
VECTOR_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "college_faiss_index")
DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_knowledge")

class CollegeChatbot:
    def __init__(self):
        logger.info("Initializing Qwen Hybrid Chatbot...")
        self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
        
        # Quantization Config for low VRAM (4-bit)
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16
        )

        # Load Base Model
        self.base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True
        )
        logger.info(f"Model loaded on device: {self.base_model.device}")

        
        # Load Adapters if they exist
        if os.path.exists(LORA_PATH):
            self.model = PeftModel.from_pretrained(self.base_model, LORA_PATH)
            logger.info(f"Loaded fine-tuned local weights from {LORA_PATH}")
        else:
            self.model = self.base_model
            logger.warning(f"Fine-tuned weights not found at {LORA_PATH}. Using base model.")

        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self.vector_db = None
        self.retriever = None
        self.refresh_retriever()

        
    def refresh_retriever(self):
        """Reloads the FAISS index from disk."""
        if os.path.exists(VECTOR_DB_PATH):
            logger.info(f"Loading FAISS index from {VECTOR_DB_PATH}")
            vdb = FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
            if vdb:
                self.vector_db = vdb
                self.retriever = vdb.as_retriever(search_kwargs={"k": 3})
            else:
                self.vector_db = None
                self.retriever = None
        else:
            logger.warning("RAG Vector DB not found.")
            self.vector_db = None
            self.retriever = None



    def check_safety_guardrails(self, query):
        harmful_keywords = ["hack grading", "steal identity", "illegal"]
        if any(word in query.lower() for word in harmful_keywords):
            return False, "I cannot assist with that request. Please contact the administration."
        return True, ""

    def _parse_field_value(self, field, text):
        """Attempts to parse standard datatypes from user text replies."""
        text_clean = text.strip().lower()
        if field == "cgpa":
            match = re.search(r'(\d+(?:\.\d+)?)', text_clean)
            if match:
                try:
                    return float(match.group(1))
                except:
                    pass
        elif field == "family_income":
            lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*lakh', text_clean)
            if lakh_match:
                try:
                    return float(lakh_match.group(1)) * 100000.0
                except:
                    pass
            match = re.search(r'([\d,]+)', text_clean)
            if match:
                clean_num = match.group(1).replace(",", "")
                try:
                    return float(clean_num)
                except:
                    pass
        elif field == "department":
            # Match departments CSE, ECE, EEE, IT, CIVIL, MECH, etc.
            for code in ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH"]:
                if code.lower() in text_clean:
                    return code
        elif field == "year":
            match = re.search(r'(\d)', text_clean)
            if match:
                try:
                    return int(match.group(1))
                except:
                    pass
            if "first" in text_clean or "1st" in text_clean: return 1
            if "second" in text_clean or "2nd" in text_clean: return 2
            if "third" in text_clean or "3rd" in text_clean: return 3
            if "fourth" in text_clean or "4th" in text_clean: return 4
        return None

    def _evaluate_eligibility(self, collected, criteria, language):
        """Checks student parameters against scholarship eligibility criteria."""
        gpa = collected.get("cgpa")
        income = collected.get("family_income")
        dept = collected.get("department")
        year = collected.get("year")
        
        name = criteria.get("scholarship_name", "Scholarship")
        reasons_failed = []
        
        if criteria.get("min_gpa") is not None and gpa is not None:
            if gpa < criteria["min_gpa"]:
                reasons_failed.append(f"CGPA is {gpa} (required: {criteria['min_gpa']}+)")
        
        if criteria.get("max_income") is not None and income is not None:
            if income > criteria["max_income"]:
                reasons_failed.append(f"Annual family income is Rs. {income:,.2f} (limit: Rs. {criteria['max_income']:,.2f})")
                
        if criteria.get("eligible_departments") is not None and dept is not None:
            depts_upper = [d.upper() for d in criteria["eligible_departments"]]
            if dept.upper() not in depts_upper:
                reasons_failed.append(f"Department is {dept} (eligible: {', '.join(depts_upper)})")
                
        if criteria.get("eligible_years") is not None and year is not None:
            if year not in criteria["eligible_years"]:
                years_str = ", ".join(map(str, criteria["eligible_years"]))
                reasons_failed.append(f"Academic year is {year} (eligible: {years_str})")

        if not reasons_failed:
            responses = {
                "en": f"Congratulations! You are eligible for the **{name}**. You meet all the eligibility criteria.",
                "hi": f"बधाई हो! आप **{name}** के लिए पात्र हैं। आप सभी पात्रता मानदंडों को पूरा करते हैं।",
                "ta": f"வாழ்த்துகள்! நீங்கள் **{name}** பெற தகுதி பெற்றுள்ளீர்கள். அனைத்து தகுதிகளையும் பூர்த்தி செய்துள்ளீர்கள்.",
                "te": f"అభినందనలు! మీరు **{name}** కి అర్హులు. మీరు అన్ని అర్హత ప్రమాణాలను పూర్తి చేశారు.",
                "ne": f"बधाई छ! तपाईं **{name}** को लागि योग्य हुनुहुन्छ। तपाईंले सबै योग्यता मापदण्डहरू पूरा गर्नुभएको छ।",
                "ar": f"تهانينا! أنت مؤهل للحصول على **{name}**. استوفيت جميع معايير الأهلية.",
                "ml": f"അഭിനന്ദനങ്ങൾ! നിങ്ങൾ **{name}**-ന് അർഹനാണ്. നിങ്ങൾ എല്ലാ യോഗ്യതാ മാനദണ്ഡങ്ങളും പാലിക്കുന്നുണ്ട്."
            }
            return True, responses.get(language, responses["en"])
        else:
            reasons_str = "; ".join(reasons_failed)
            responses = {
                "en": f"Unfortunately, you are not eligible for the **{name}** for the following reason(s): {reasons_str}.",
                "hi": f"दुर्भाग्य से, आप निम्नलिखित कारणों से **{name}** के लिए पात्र नहीं हैं: {reasons_str}।",
                "ta": f"துரதிர்ஷ்டவசமாக, பின்வரும் காரணங்களால் நீங்கள் **{name}** பெற தகுதியற்றவர்: {reasons_str}.",
                "te": f"దురదృష్టవశాత్తు, క్రింది కారణాల వల్ల మీరు **{name}** కి అర్హులు కారు: {reasons_str}.",
                "ne": f"दुर्भाग्यवश, तपाईं निम्न कारण(हरू) ले **{name}** को लागि योग्य हुनुहुन्न: {reasons_str}।",
                "ar": f"للأسف، أنت غير مؤهل للحصول على **{name}** للأسباب التالية: {reasons_str}.",
                "ml": f"നിർഭാഗ്യവശാൽ, താഴെ പറയുന്ന കാരണങ്ങളാൽ നിങ്ങൾ **{name}**-ന് യോഗ്യനല്ല: {reasons_str}."
            }
            return False, responses.get(language, responses["en"])

    def process_query(self, query, language="en", context=None):
        if context is None:
            context = {}
            
        if "history" not in context or context.get("reset_memory") or context.get("new_session"):
            context["history"] = []
            
        is_safe, refusal_msg = self.check_safety_guardrails(query)
        if not is_safe:
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": refusal_msg})
            return refusal_msg, context

        # 1. Check if we are currently collecting scholarship details
        if "scholarship_check" in context:
            state = context["scholarship_check"]
            scholarship_id = state["scholarship_id"]
            missing_fields = state["missing_fields"]
            collected = state["collected"]

            if missing_fields:
                current_missing_field = missing_fields[0]
                val = self._parse_field_value(current_missing_field, query)
                if val is not None:
                    collected[current_missing_field] = val
                    missing_fields.pop(0)
                else:
                    retry_prompt = {
                        "en": f"I couldn't quite understand that. Please specify your {current_missing_field.replace('_', ' ')} (e.g. for CGPA: 8.5, for family income: 250000):",
                        "hi": f"मैं समझ नहीं पाया। कृपया अपना {current_missing_field.replace('_', ' ')} दर्ज करें (जैसे CGPA के लिए: 8.5, पारिवारिक आय के लिए: 250000):",
                        "ta": f"எங்களால் அதைப் புரிந்து கொள்ள முடியவில்லை. தயவுசெய்து உங்கள் {current_missing_field.replace('_', ' ')} குறிப்பிடவும் (எ.கா. CGPA: 8.5, குடும்ப வருமானம்: 250000):",
                        "te": f"నేను దానిని అర్థం చేసుకోలేకపోయాను. దయచేసి మీ {current_missing_field.replace('_', ' ')} పేర్కొనండి (ఉదా. CGPA కోసం: 8.5, కుటుంబ ఆదాయం కోసం: 250000):"
                    }
                    response = retry_prompt.get(language, retry_prompt["en"])
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": response})
                    return response, context

            if missing_fields:
                next_missing = missing_fields[0]
                ask_prompt = {
                    "en": f"To check your eligibility, please enter your {next_missing.replace('_', ' ')}:",
                    "hi": f"अपनी पात्रता की जांच करने के लिए, कृपया अपनी {next_missing.replace('_', ' ')} दर्ज करें:",
                    "ta": "உங்கள் தகுதியைச் சரிபார்க்க, தயவுசெய்து உங்கள் " + next_missing.replace('_', ' ') + " உள்ளிடவும்:",
                    "te": "మీ అర్హతను తనిఖీ చేయడానికి, దయచేసి మీ " + next_missing.replace('_', ' ') + " నమోదు చేయండి:"
                }
                response = ask_prompt.get(language, ask_prompt["en"])
                context["history"].append({"role": "user", "text": query})
                context["history"].append({"role": "bot", "text": response})
                return response, context
            else:
                from database import db
                sch_doc = db.collection("scholarships").document(scholarship_id).get()
                criteria = sch_doc.to_dict() if sch_doc.exists else {}
                
                eligible, reason = self._evaluate_eligibility(collected, criteria, language)
                response = reason
                del context["scholarship_check"]
                context["history"].append({"role": "user", "text": query})
                context["history"].append({"role": "bot", "text": response})
                return response, context

        # 2. Check category-specific queries (e.g., AICTE, Central Gov, Girls, PwD, Sports, Corporate)
        query_lower = query.lower()
        from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS

        # Check if asking specifically about AICTE or another category
        cat_matched = None
        if "aicte" in query_lower:
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 3), None)
        elif any(k in query_lower for k in ["central gov", "central sector", "nsp", "national scholarship"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 1), None)
        elif any(k in query_lower for k in ["category-based", "caste", "minority", "sc ", "st ", "obc"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 2), None)
        elif any(k in query_lower for k in ["state gov", "state scholarship"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 4), None)
        elif any(k in query_lower for k in ["merit", "academic excellence"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 5), None)
        elif any(k in query_lower for k in ["need", "income", "poor", "financial aid"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 6), None)
        elif any(k in query_lower for k in ["girl", "girls", "female", "women"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 7), None)
        elif any(k in query_lower for k in ["pwd", "disability", "disabled", "handicapped"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 8), None)
        elif any(k in query_lower for k in ["sports", "athlete"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 10), None)
        elif any(k in query_lower for k in ["corporate", "csr", "reliance", "hdfc", "private"]):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 13), None)

        if cat_matched:
            # Get real scholarships under this category from database / ALL_SCHOLARSHIPS
            cat_schs = [s for s in ALL_SCHOLARSHIPS if s.get("category_id") == cat_matched["id"]]
            if cat_schs:
                sch_lines = []
                for idx, s in enumerate(cat_schs, 1):
                    cgpa_str = f"Min CGPA: {s['min_gpa']}" if s.get("min_gpa") else "No min CGPA"
                    inc_str = f"Max Income: ₹{(s['max_income']/100000):.1f}L/yr" if s.get("max_income") else "No income limit"
                    caste_str = f" ({s['caste_category']})" if s.get("caste_category") else ""
                    
                    sch_lines.append(
                        f"**{idx}. {s['scholarship_name']}**{caste_str}\n"
                        f"   - 💡 **Description**: {s['description']}\n"
                        f"   - 💰 **Benefits**: {s['benefits']}\n"
                        f"   - 🎓 **Eligibility**: {cgpa_str} | {inc_str}"
                    )
                
                sch_text = "\n\n".join(sch_lines)
                icon_symbol = cat_matched.get("icon", "🎓")
                res_msg = (
                    f"### {icon_symbol} Official {cat_matched['name']} ({len(cat_schs)} Available)\n\n"
                    f"Here are the verified scholarships available in your Student Portal under **Category #{cat_matched['id']} ({cat_matched['name']})**:\n\n"
                    f"{sch_text}\n\n"
                    f"📌 **Application & Form Download**: Navigate to the **Scholarships Hub** tab in your Student Dashboard. Select **Category #{cat_matched['id']}** to view full criteria, mandatory document checklists, and **download official application forms** with Double Passkey protection!"
                )
                context["history"].append({"role": "user", "text": query})
                context["history"].append({"role": "bot", "text": res_msg})
                return res_msg, context

        # 3. Check if user is asking for general scholarship overview or list of scholarships
        general_sch_keywords = [
            "scholarships details", "scholarship details", "scholarships detail", "scholarship detail",
            "available scholarships", "all scholarships", "list scholarships", "show scholarships",
            "types of scholarship", "categories of scholarship", "14 categories", "14 types",
            "what scholarship", "list scholarship", "scholarship info", "scholarship options", "scholarship list"
        ]
        
        is_general_overview = any(k in query_lower for k in general_sch_keywords) or query_lower.strip() in ["scholarship", "scholarships", "scholarship details", "scholarships details"]

        if is_general_overview:
            if "scholarship_check" in context:
                del context["scholarship_check"]

            cat_lines = []
            for c in SCHOLARSHIP_CATEGORIES:
                icon_sym = c.get("icon", "🎓")
                cat_lines.append(f"**Category #{c['id']} - {icon_sym} {c['name']}**\n- 💡 {c['description']}")

            cat_list_str = "\n\n".join(cat_lines)
            
            res_msg = (
                f"### 🎓 Official 14 Categories of Scholarships (Undergraduate Student Portal)\n\n"
                f"Indian students pursuing UG degree courses (B.E./B.Tech, B.Sc., B.Com., B.A., MBBS, B.Pharm, Law, etc.) can explore and apply under **14 distinct verified categories**:\n\n"
                f"{cat_list_str}\n\n"
                f"📌 **How to Apply & Download Forms**: Navigate to the **Scholarships Hub** tab in your Student Dashboard. Select any Category to view complete eligibility criteria, mandatory document checklists, and **download official application forms** protected by Double Passkey security!"
            )
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": res_msg})
            return res_msg, context

        # 4. Check if user is asking about scholarship eligibility, documents, or form download
        is_scholarship_query = any(k in query_lower for k in ["eligible", "eligibility", "qualification", "apply for", "can i get", "document", "form", "download"]) and \
                               any(k in query_lower for k in ["scholarship", "stipend", "aid", "fee waiver"])
        
        if is_scholarship_query or "scholarship" in query_lower:
            from database import db
            scholarships = db.collection("scholarships").stream()
            matched_sch = None
            for s in scholarships:
                sdata = s.to_dict()
                sname = sdata.get("scholarship_name", "").lower()
                words = sname.split()
                if any(w in query_lower for w in words if len(w) > 3):
                    matched_sch = sdata
                    break

            if not matched_sch:
                # Check ALL_SCHOLARSHIPS from memory fallback
                for sdata in ALL_SCHOLARSHIPS:
                    sname = sdata.get("scholarship_name", "").lower()
                    words = sname.split()
                    if any(w in query_lower for w in words if len(w) > 3):
                        matched_sch = sdata
                        break
            
            if matched_sch:
                # Check if asking specifically for documents or form download
                if any(k in query_lower for k in ["document", "docs", "paper", "checklist", "needed"]):
                    docs_list = matched_sch.get("necessary_documents", ["Aadhaar Card", "Marksheets", "Income Cert"])
                    docs_formatted = "\n".join([f"  - 📄 {d}" for d in docs_list])
                    res = (
                        f"### 📋 Necessary Documents Needed for **{matched_sch['scholarship_name']}**\n\n"
                        f"To apply for this scholarship, you must collect and attach the following documents:\n"
                        f"{docs_formatted}\n\n"
                        f"🔒 *Note: All uploaded documents stored in cloud storage require Double Passkey verification.*"
                    )
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": res})
                    return res, context

                if any(k in query_lower for k in ["form", "download", "application form"]):
                    res = (
                        f"### 📥 Download Form for **{matched_sch['scholarship_name']}**\n\n"
                        f"You can download the official application form directly from the **Scholarships** tab in your Student Dashboard.\n"
                        f"🔐 **Double Passkey Security**: Before downloading, you will be prompted to enter your **Passkey 1** and **Passkey 2** to authorize cloud storage access."
                    )
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": res})
                    return res, context

                # Otherwise perform eligibility check
                student_id = context.get("user_id", "2023CS001")
                student_doc = db.collection("students").document(student_id).get()
                student_profile = student_doc.to_dict() if student_doc.exists else {}

                collected = {
                    "cgpa": student_profile.get("cgpa"),
                    "department": student_profile.get("department"),
                    "year": student_profile.get("year"),
                    "family_income": student_profile.get("family_income")
                }

                missing_fields = []
                if matched_sch.get("min_gpa") is not None and collected["cgpa"] is None:
                    missing_fields.append("cgpa")
                if matched_sch.get("max_income") is not None and collected["family_income"] is None:
                    missing_fields.append("family_income")
                if matched_sch.get("eligible_departments") is not None and collected["department"] is None:
                    missing_fields.append("department")
                if matched_sch.get("eligible_years") is not None and collected["year"] is None:
                    missing_fields.append("year")

                if missing_fields:
                    context["scholarship_check"] = {
                        "scholarship_id": matched_sch["id"],
                        "missing_fields": missing_fields,
                        "collected": collected
                    }
                    next_missing = missing_fields[0]
                    ask_prompt = {
                        "en": f"I see you are asking about the {matched_sch['scholarship_name']}. To check your eligibility, please enter your {next_missing.replace('_', ' ')}:",
                        "hi": f"मुझे लगता है कि आप {matched_sch['scholarship_name']} के बारे में पूछ रहे हैं। अपनी पात्रता की जांच करने के लिए, कृपया अपनी {next_missing.replace('_', ' ')} दर्ज करें:",
                        "ta": f"நீங்கள் {matched_sch['scholarship_name']} பற்றி கேட்கிறீர்கள் என்று நான் காண்கிறேன். உங்கள் தகுதியைச் சரிபார்க்க, தயவுசெய்து உங்கள் {next_missing.replace('_', ' ')} உள்ளிடவும்:",
                        "te": f"మీరు {matched_sch['scholarship_name']} గురించి అడుగుతున్నట్లు నేను చూస్తున్నాను. మీ అర్హతను తనిఖీ చేయడానికి, దయచేసి మీ {next_missing.replace('_', ' ')} నమోదు చేయండి:",
                        "ne": f"म देख्छु कि तपाईं {matched_sch['scholarship_name']} को बारेमा सोध्दै हुनुहुन्छ। तपाईंको योग्यता जाँच गर्न, कृपया तपाईंको {next_missing.replace('_', ' ')} प्रविष्ट गर्नुहोस्:",
                        "ar": f"أرى أنك تسأل عن {matched_sch['scholarship_name']}. للتحقق من أهليتك، يرجى إدخال {next_missing.replace('_', ' ')} الخاصة بك:",
                        "ml": f"നിങ്ങൾ {matched_sch['scholarship_name']}-നെക്കുറിച്ചാണ് ചോദിക്കുന്നതെന്ന് ഞാൻ കാണുന്നു. നിങ്ങളുടെ യോഗ്യത പരിശോധിക്കാൻ, ദയവായി നിങ്ങളുടെ {next_missing.replace('_', ' ')} രേഖപ്പെടുത്തുക:"
                    }
                    response = ask_prompt.get(language, ask_prompt["en"])
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": response})
                    return response, context
                else:
                    eligible, reason = self._evaluate_eligibility(collected, matched_sch, language)
                    response = reason
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": response})
                    return response, context

        # 5. Fast Greeting Handler
        if query_lower in ["hi", "hello", "hey", "namaste", "good morning", "good afternoon", "hlo", "hi there", "hola"]:
            greetings = {
                "en": "Hello! 👋 I am your College & Scholarship Assistant. How can I help you today?",
                "hi": "नमस्ते! 👋 मैं आपका कॉलेज और छात्रवृत्ति सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?",
                "ta": "வணக்கம்! 👋 நான் உங்கள் கல்லூரி மற்றும் உதவித்தொகை உதவியாளர். இன்று உங்களுக்கு எப்படி உதவ முடியும்?",
                "te": "నమస్తే! 👋 నేను మీ కాలేజ్ మరియు స్కాలర్‌షిప్ అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
                "ne": "नमस्ते! 👋 म तपाईंको कलेज र छात्रवृत्ति सहायक हुँ। आज म तपाईंलाई कसरी मद्दत गर्न सक्छु?",
                "ar": "مرحباً! 👋 أنا مساعدك للكلية والمنح الدراسية. كيف يمكنني مساعدتك اليوم؟",
                "ml": "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ കോളേജ് & സ്‌കോളർഷിപ്പ് അസിസ്റ്റന്റ് ആണ്. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?"
            }
            res_greet = greetings.get(language, greetings["en"])
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": res_greet})
            return res_greet, context

        # 6. Standard RAG fallback (Respect language parameter from UI)
        detected_lang = language or "en"
        if len(query.strip()) > 20:
            try:
                auto_d = detect(query)
                if auto_d in ["en", "hi", "ta", "te", "ne", "ar", "ml"]:
                    detected_lang = auto_d
            except:
                pass
            
        context_str = ""
        if self.retriever:
            try:
                retrieved_docs = self.retriever.invoke(query)
                context_str = "\n".join([doc.page_content for doc in retrieved_docs])
            except Exception as e:
                logger.error(f"RAG retrieval error: {e}")
            
        system_instructions = {
            "hi": "आप एक कॉलेज सहायक बॉट हैं। नीचे दी गई जानकारी का उपयोग करके उत्तर दें।",
            "en": "You are a helpful college assistant bot. Answer the question based on the context provided.",
            "ta": "நீங்கள் ஒரு கல்லூரி உதவி போட். வழங்கப்பட்ட சூழலின் அடிப்படையில் கேள்விக்கு பதிலளிக்கவும்.",
            "te": "మీరు సహాయకరమైన కళాశాల సహాయక బాట్. అందించిన సందర్భం ఆధారంగా ప్రశ్నకు సమాధానం ఇవ్వండి.",
            "ne": "तपाईं एक सहयोगी कलेज सहायक बट हुनुहुन्छ। प्रदान गरिएको सन्दर्भको आधारमा प्रश्नको जवाफ दिनुहोस्।",
            "ar": "أنت بوت مساعد جامعي مفيد. أجب عن السؤال بناءً على السياق المقدم.",
            "ml": "നിങ്ങൾ ഒരു കോളേജ് അസിസ്റ്റന്റ് ബോട്ട് ആണ്. നൽകിയിരിക്കുന്ന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ ചോദ്യത്തിന് ഉത്തരം നൽകുക."
        }
        sys_prompt = system_instructions.get(detected_lang, system_instructions["en"])
        sys_prompt += f" You MUST respond in the language code '{detected_lang}' (e.g. ne = Nepali, ar = Arabic, ml = Malayalam, en = English, hi = Hindi, ta = Tamil, te = Telugu)."

        prompt = f"<|im_start|>system\n{sys_prompt}\nContext: {context_str}<|im_end|>\n"
        for turn in context.get("history", [])[-8:]:
            role = turn["role"]
            text = turn["text"]
            prompt += f"<|im_start|>{role}\n{text}<|im_end|>\n"
        prompt += f"<|im_start|>user\n{query}<|im_end|>\n<|im_start|>assistant\n"
        
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        outputs = self.model.generate(**inputs, max_new_tokens=256, temperature=0.2, repetition_penalty=1.1)
        response = self.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        
        trimmed_response = response.strip()
        context["history"].append({"role": "user", "text": query})
        context["history"].append({"role": "bot", "text": trimmed_response})
        
        return trimmed_response, context

# Lazy initialization
bot = None

def get_bot():
    global bot
    if bot is None:
        bot = CollegeChatbot()
    return bot
