import os
import torch
import json
import re
import sys
from unittest.mock import MagicMock

# Safeguard against Windows Application Control policy blocking sklearn compiled DLL extensions (_argkmin)
try:
    import sklearn.metrics
except Exception:
    sklearn_mock = MagicMock()
    sys.modules['sklearn'] = sklearn_mock
    sys.modules['sklearn.metrics'] = sklearn_mock

# Dynamic / Optional AI imports with resilient fallback
import importlib

def _safe_import(mod_name):
    try:
        return importlib.import_module(mod_name)
    except Exception:
        return None

_transformers = _safe_import("transformers")
AutoModelForCausalLM = getattr(_transformers, "AutoModelForCausalLM", None) if _transformers else None
AutoTokenizer = getattr(_transformers, "AutoTokenizer", None) if _transformers else None
BitsAndBytesConfig = getattr(_transformers, "BitsAndBytesConfig", None) if _transformers else None

_peft = _safe_import("peft")
PeftModel = getattr(_peft, "PeftModel", None) if _peft else None

_langchain_hf = _safe_import("langchain_huggingface")
HuggingFaceEmbeddings = getattr(_langchain_hf, "HuggingFaceEmbeddings", None) if _langchain_hf else None

_langchain_faiss = _safe_import("langchain_community.vectorstores")
FAISS = getattr(_langchain_faiss, "FAISS", None) if _langchain_faiss else None

_langchain_core_doc = _safe_import("langchain_core.documents")
Document = getattr(_langchain_core_doc, "Document", None) if _langchain_core_doc else None

_langdetect = _safe_import("langdetect")
detect = getattr(_langdetect, "detect", lambda text: "en") if _langdetect else (lambda text: "en")

easyocr = _safe_import("easyocr")

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
        self.tokenizer = None
        self.base_model = None
        self.model = None

        if AutoTokenizer is not None and AutoModelForCausalLM is not None:
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
                # Load Base Model: check CUDA GPU vs CPU
                if torch.cuda.is_available() and BitsAndBytesConfig is not None:
                    try:
                        logger.info("CUDA detected. Loading model with 4-bit quantization...")
                        bnb_config = BitsAndBytesConfig(
                            load_in_4bit=True,
                            bnb_4bit_use_double_quant=True,
                            bnb_4bit_quant_type="nf4",
                            bnb_4bit_compute_dtype=torch.bfloat16
                        )
                        self.base_model = AutoModelForCausalLM.from_pretrained(
                            BASE_MODEL,
                            quantization_config=bnb_config,
                            device_map="auto",
                            trust_remote_code=True
                        )
                    except Exception as e:
                        logger.warning(f"Failed 4-bit GPU quantization: {e}. Falling back to standard CPU model loading.")
                        self.base_model = AutoModelForCausalLM.from_pretrained(
                            BASE_MODEL,
                            dtype=torch.float32,
                            device_map="cpu",
                            trust_remote_code=True
                        )
                else:
                    logger.info("Loading Qwen model on CPU (float32)...")
                    self.base_model = AutoModelForCausalLM.from_pretrained(
                        BASE_MODEL,
                        dtype=torch.float32,
                        device_map="cpu",
                        trust_remote_code=True
                    )

                # Load Adapters if they exist
                if PeftModel is not None and os.path.exists(LORA_PATH):
                    self.model = PeftModel.from_pretrained(self.base_model, LORA_PATH)
                    logger.info(f"Loaded fine-tuned local weights from {LORA_PATH}")
                else:
                    self.model = self.base_model
            except Exception as e:
                logger.warning(f"Could not load neural model weights: {e}. Using deterministic scholarship engine.")
        else:
            logger.info("Neural transformers not available in current environment. Using deterministic scholarship engine.")

        try:
            from utils_learning import safe_init_embeddings, learning_system
            self.embeddings = learning_system.embeddings if hasattr(learning_system, 'embeddings') else safe_init_embeddings("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        except Exception:
            self.embeddings = None

        self.vector_db = None
        self.retriever = None
        self.refresh_retriever()

    def refresh_retriever(self):
        """Reloads the FAISS index from disk safely, building it if missing."""
        try:
            from utils_learning import learning_system
            learning_system.ensure_faiss_index_built()
        except Exception as e:
            logger.error(f"Could not check or build initial FAISS index: {e}")

        faiss_index_file = os.path.join(VECTOR_DB_PATH, "index.faiss")
        faiss_pkl_file = os.path.join(VECTOR_DB_PATH, "index.pkl")

        if os.path.exists(faiss_index_file) and os.path.exists(faiss_pkl_file):
            try:
                logger.info(f"Loading FAISS index from {VECTOR_DB_PATH}")
                if FAISS is not None and hasattr(FAISS, 'load_local') and self.embeddings is not None:
                    vdb = FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
                    if vdb:
                        self.vector_db = vdb
                        self.retriever = vdb.as_retriever(search_kwargs={"k": 3})
                    else:
                        self.vector_db = None
                        self.retriever = None
                else:
                    self.vector_db = None
                    self.retriever = None
            except Exception as e:
                logger.error(f"Error loading FAISS index: {e}")
                self.vector_db = None
                self.retriever = None
        else:
            logger.warning(f"FAISS index files missing in {VECTOR_DB_PATH}.")
            self.vector_db = None
            self.retriever = None

    def get_all_scholarships_live(self):
        """
        Retrieves all live scholarships by combining the comprehensive master catalog
        with live scholarships created, imported, or updated by Administrators in Firestore.
        """
        from scholarships_data import ALL_SCHOLARSHIPS
        try:
            from database import db
            db_docs = list(db.collection("scholarships").stream())
            if db_docs:
                live_map = {s.get("id", f"sch_{i}"): dict(s) for i, s in enumerate(ALL_SCHOLARSHIPS)}
                for doc in db_docs:
                    d_data = doc.to_dict()
                    doc_id = doc.id
                    d_data["id"] = doc_id
                    if doc_id in live_map:
                        live_map[doc_id] = {**live_map[doc_id], **d_data}
                    else:
                        live_map[doc_id] = d_data
                return list(live_map.values())
        except Exception as e:
            logger.warning(f"Error reading live DB scholarships: {e}")
        return list(ALL_SCHOLARSHIPS)

    def check_safety_guardrails(self, query):
        harmful_keywords = ["hack grading", "steal identity", "illegal"]
        if any(word in query.lower() for word in harmful_keywords):
            return False, "I cannot assist with that request. Please contact the administration."
        return True, ""

    def _parse_field_value(self, field, text):
        """Attempts to parse standard datatypes from user text replies (English & Tanglish/Hinglish)."""
        text_clean = text.strip().lower()
        if field == "cgpa":
            match = re.search(r'(\d+(?:\.\d+)?)', text_clean)
            if match:
                try:
                    return float(match.group(1))
                except:
                    pass
        elif field == "family_income":
            lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)', text_clean)
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
            if "second" in text_clean or "2nd" in text_clean or "rendam" in text_clean: return 2
            if "third" in text_clean or "3rd" in text_clean or "moonram" in text_clean: return 3
            if "fourth" in text_clean or "4th" in text_clean or "naangam" in text_clean: return 4
        return None

    def _evaluate_eligibility(self, collected, criteria, language="en"):
        """Evaluates student parameters against scholarship eligibility criteria."""
        reasons = []
        name = criteria.get("scholarship_name", "Scholarship")
        
        min_gpa = criteria.get("min_gpa")
        if min_gpa is not None and collected.get("cgpa", 0.0) < min_gpa:
            reasons.append(f"Min CGPA required is {min_gpa} (Your CGPA: {collected.get('cgpa')})")
            
        max_income = criteria.get("max_income")
        if max_income is not None and collected.get("family_income", 0.0) > max_income:
            reasons.append(f"Max Annual Family Income limit is Rs. {max_income:,.0f}")
            
        depts = criteria.get("eligible_departments")
        if depts and "ALL" not in [d.upper() for d in depts]:
            dept_val = collected.get("department", "").upper()
            if dept_val not in [d.upper() for d in depts]:
                reasons.append(f"Eligible departments: {', '.join(depts)}")
                
        years = criteria.get("eligible_years")
        if years and collected.get("year") not in years:
            reasons.append(f"Eligible academic years: {', '.join(map(str, years))}")
            
        if not reasons:
            success_msg = {
                "en": f"🎉 Congratulations! You are ELIGIBLE for **{name}**. You meet all the qualification criteria.",
                "hi": f"🎉 बधाई हो! आप **{name}** के लिए पात्र हैं। आप सभी मानदंडों को पूरा करते हैं।",
                "ta": f"🎉 வாழ்த்துக்கள்! நீங்கள் **{name}**-க்கு தகுதி பெற்றுள்ளீர்கள்.",
                "te": f"🎉 అభినందనలు! మీరు **{name}**కి అర్హులు."
            }
            return True, success_msg.get(language, success_msg["en"])
        else:
            reasons_str = "; ".join(reasons)
            fail_msg = {
                "en": f"Unfortunately, you do not meet the criteria for **{name}**: {reasons_str}.",
                "hi": f"दुर्भाग्य से, आप **{name}** के मानदंडों को पूरा नहीं करते हैं: {reasons_str}।",
                "ta": f"துரதிர்ஷ்டவசமாக, நீங்கள் **{name}**-க்கான தகுதிகளை பெறவில்லை: {reasons_str}.",
                "te": f"దురదృష్టవశాత్తు, మీరు **{name}** అర్హతలను పొందలేదు: {reasons_str}."
            }
            return False, fail_msg.get(language, fail_msg["en"])

    def format_full_scholarship_details(self, sch):
        """Formats complete, detailed information across all 13 sections for a scholarship."""
        name = sch.get("scholarship_name", "Scholarship Scheme")
        ref_id = sch.get("scholarship_id_ref", sch.get("id", "REF-2025"))
        provider = sch.get("provider_organization", "Government / Institutional Authority")
        cat_name = sch.get("category_name", "Scholarships")
        purpose = sch.get("purpose", sch.get("description", "Financial support for higher education."))
        desc = sch.get("detailed_description") or sch.get("description", "Provides financial assistance.")
        
        # Benefits
        benefits = sch.get("benefits", "Financial Assistance")
        monthly = sch.get("monthly_amount", "Equivalent monthly stipend")
        annual = sch.get("annual_amount", benefits)
        tuition = sch.get("tuition_fee_coverage", "Included in annual grant")
        other_benefits = sch.get("other_benefits", "Direct Benefit Transfer (DBT) credit into Aadhaar-seeded bank account")

        # Eligibility & Demographics
        nationality = sch.get("nationality", "Indian")
        citizenship = sch.get("citizenship", "Indian Citizen")
        domicile = sch.get("domicile_restriction", "All States of India")
        gender = sch.get("gender", "All")
        caste = sch.get("caste_category", "All Categories")
        minority = sch.get("minority_eligibility", "Eligible")
        pwd = sch.get("pwd_eligibility", "5% horizontal reservation")
        age_str = f"{sch.get('min_age', 17)} - {sch.get('max_age', 25)} years"
        
        # Academic Criteria
        min_gpa = sch.get("min_gpa", "No min CGPA requirement")
        min_pct = f"{sch.get('min_percentage', 60.0)}%"
        edu_level = sch.get("current_education_level", "Undergraduate")
        courses = ", ".join(sch.get("eligible_courses", ["B.E.", "B.Tech", "B.Sc", "B.Com"]))
        depts_raw = sch.get("eligible_departments", ["ALL"])
        depts = "ALL DEPARTMENTS" if "ALL" in [str(d).upper() for d in depts_raw] else ", ".join(depts_raw)
        years_raw = sch.get("eligible_years", [1, 2, 3, 4])
        years_str = ", ".join(f"Year {y}" for y in years_raw)
        backlog = sch.get("backlog_restrictions", "No standing backlogs permitted for renewals")

        # Financial Requirements
        max_income = sch.get("max_income")
        inc_str = f"₹{(max_income/100000):.1f} Lakhs / year" if max_income else "No family income limit"
        inc_auth = sch.get("accepted_income_authority", "Tehsildar / Revenue Authority")
        
        # Application & Documents
        portal_url = sch.get("official_website") or sch.get("application_portal_url") or sch.get("application_url") or "https://scholarships.gov.in"
        if not portal_url.startswith("http"):
            portal_url = "https://scholarships.gov.in"
        portal_name = sch.get("application_portal", sch.get("official_portal", "National Scholarship Portal"))
        method = sch.get("application_method", "Online Portal")
        fee = sch.get("application_fee", "Free of Cost (₹0)")
        procedure = sch.get("step_by_step_procedure", "1. Register on Portal -> 2. Fill Details -> 3. Upload Documents -> 4. Institutional Verification -> 5. DBT Disbursement")
        docs_list = sch.get("necessary_documents") or sch.get("documents") or ["Aadhaar Card", "Marksheets", "Income Certificate", "Bonafide Certificate", "Bank Passbook"]
        docs_str = "\n".join([f"   - 📄 {d}" for d in docs_list])
        
        # Selection & Renewal
        selection = sch.get("selection_criteria", "Merit-cum-Means based on academic marks and income")
        renewal_info = sch.get("renewal_eligibility", "Annual renewal upon achieving minimum 50% passing marks")
        min_renewal_marks = sch.get("min_renewal_marks", "50% marks in previous annual/semester exams")
        
        # Restrictions
        restrictions = sch.get("who_cannot_apply", "Students drawing dual scholarships or in correspondence courses")
        dual_allowed = "❌ Not Allowed" if not sch.get("multiple_scholarships_allowed", False) else "Allowed"
        
        # Important Dates
        dates = sch.get("important_dates") or {}
        open_date = dates.get("opening_date", "15th July 2025") if isinstance(dates, dict) else "15th July 2025"
        close_date = dates.get("closing_date", "30th November 2025") if isinstance(dates, dict) else "30th November 2025"
        disb_date = dates.get("disbursement_date", "February - March 2026") if isinstance(dates, dict) else "February - March 2026"
        
        # Contacts
        contact = sch.get("contact_authority") or {}
        helpline = contact.get("helpline_number", sch.get("contact_phone", "0120-6619540 (NSP Helpline)")) if isinstance(contact, dict) else sch.get("contact_phone", "0120-6619540 (NSP Helpline)")
        email = contact.get("official_email", sch.get("contact_email", "helpdesk@scholarships.gov.in")) if isinstance(contact, dict) else sch.get("contact_email", "helpdesk@scholarships.gov.in")

        details = (
            f"### 🏆 **{name}**\n"
            f"📌 **Ref ID**: `{ref_id}` | **Category**: {cat_name} | **Provider**: {provider}\n\n"
            f"💡 **1. Basic Scope & Purpose**:\n"
            f"   {purpose}\n"
            f"   {desc}\n\n"
            f"💰 **2. Financial Benefits & Allowances**:\n"
            f"   - 💵 **Total Grant**: **{benefits}** ({annual})\n"
            f"   - 🗓️ **Monthly Equivalent**: {monthly}\n"
            f"   - 🎓 **Fee Coverage**: {tuition}\n"
            f"   - ⚡ **Disbursement Method**: {other_benefits}\n\n"
            f"🌐 **3. Eligibility Criteria & Demographics**:\n"
            f"   - 🇮🇳 **Nationality & Citizenship**: {nationality} ({citizenship})\n"
            f"   - 🗺️ **Domicile**: {domicile}\n"
            f"   - 🎂 **Age Limit**: {age_str}\n"
            f"   - 🚻 **Gender Eligibility**: {gender}\n"
            f"   - 👥 **Community / Social Quota**: {caste}\n"
            f"   - ♿ **PwD / Specially Abled**: {pwd}\n"
            f"   - 🕌 **Minority Status**: {minority}\n\n"
            f"🎓 **4. Academic Requirements**:\n"
            f"   - 📚 **Level & Degree**: {edu_level} ({courses})\n"
            f"   - 🏫 **Eligible Branches**: {depts}\n"
            f"   - 📅 **Eligible Years**: {years_str}\n"
            f"   - 📊 **Academic Cutoff**: Min CGPA: **{min_gpa}** (Min {min_pct})\n"
            f"   - ⚠️ **Backlog Restriction**: {backlog}\n\n"
            f"💵 **5. Financial Requirements**:\n"
            f"   - 💰 **Family Income Ceiling**: **{inc_str}**\n"
            f"   - 🏛️ **Accepted Authority**: {inc_auth}\n\n"
            f"📋 **6. Mandatory Document Checklist**:\n"
            f"{docs_str}\n\n"
            f"📝 **7. Application Process & Method**:\n"
            f"   - 💻 **Method**: {method} | **Fee**: {fee}\n"
            f"   - 🌐 **Portal**: [{portal_name}]({portal_url})\n"
            f"   - 🔢 **Procedure**: {procedure}\n\n"
            f"⚖️ **8. Selection & Renewal Rules**:\n"
            f"   - 🎯 **Selection**: {selection}\n"
            f"   - 🔄 **Renewal Criteria**: {renewal_info} (Requires {min_renewal_marks})\n\n"
            f"🚫 **9. Restrictions & Disqualifications**:\n"
            f"   - ⚠️ **Exclusions**: {restrictions}\n"
            f"   - 🛑 **Dual Scholarship Concurrency**: {dual_allowed}\n\n"
            f"📅 **10. Important Dates Schedule**:\n"
            f"   - 🟢 **Opening Date**: {open_date}\n"
            f"   - 🔴 **Application Deadline**: **{close_date}**\n"
            f"   - 💳 **Expected Disbursement**: {disb_date}\n\n"
            f"📞 **11. Official Contact & Helpline**:\n"
            f"   - ☎️ **Helpline**: {helpline}\n"
            f"   - ✉️ **Email**: {email}\n\n"
            f"⚡ **Direct Application Link**:\n"
            f"👉 [Apply Directly on Official Portal]({portal_url})\n"
        )
        return details

    def get_all_eligible_scholarships(self, student_profile, language="en"):
        """Evaluates student parameters against ALL scholarships and returns full details for ALL matching schemes."""
        cgpa = student_profile.get("cgpa", 8.5)
        family_income = student_profile.get("family_income", 250000.0)
        dept = (student_profile.get("department") or "CSE").upper()
        
        year_raw = student_profile.get("year") or 3
        if isinstance(year_raw, str):
            match = re.search(r'(\d)', str(year_raw))
            year = int(match.group(1)) if match else 3
        else:
            try:
                year = int(year_raw)
            except:
                year = 3

        caste = (student_profile.get("caste_category") or "BC / MBC").upper()
        gender = (student_profile.get("gender") or "All").capitalize()

        all_schemes = self.get_all_scholarships_live()

        eligible_schemes = []
        for s in all_schemes:
            min_gpa = s.get("min_gpa")
            if min_gpa is not None and cgpa < min_gpa:
                continue

            max_inc = s.get("max_income")
            if max_inc is not None and family_income > max_inc:
                continue

            s_depts = [d.upper() for d in s.get("eligible_departments", ["ALL"])]
            if "ALL" not in s_depts and dept not in s_depts:
                continue

            s_years = s.get("eligible_years", [1, 2, 3, 4, 5])
            if year not in s_years:
                continue

            s_gender = s.get("gender", "All").lower()
            if s_gender in ["female", "girl", "girls"] and gender.lower() not in ["female", "girl", "girls"]:
                continue

            eligible_schemes.append(s)

        if eligible_schemes:
            blocks = []
            for idx, s in enumerate(eligible_schemes, 1):
                blocks.append(f"#### {idx}. " + self.format_full_scholarship_details(s))

            schemes_formatted = "\n\n---\n\n".join(blocks)
            
            headers = {
                "en": f"### 🎉 You qualify for **{len(eligible_schemes)} Eligible Scholarships**!\n\nBased on your verified profile (**CGPA: {cgpa}**, **Family Income: Rs. {family_income:,.0f}**, **Dept: {dept}**, **Year: {year}**, **Category: {caste}**), here are **ALL** the scholarships you are eligible to apply for:\n\n",
                "hi": f"### 🎉 आप **{len(eligible_schemes)} छात्रवृत्तियों** के लिए पात्र हैं!\n\nआपकी प्रोफाइल (**CGPA: {cgpa}**, **आय: Rs. {family_income:,.0f}**, **विभाग: {dept}**, **वर्ष: {year}**) के आधार पर सभी पात्र छात्रवृत्तियां:\n\n",
                "ta": f"### 🎉 நீங்கள் **{len(eligible_schemes)} உதவித்தொகைகளுக்கு** தகுதி பெற்றுள்ளீர்கள்!\n\nஉங்கள் விவரக்குறிப்பின் அடிப்படையில் (**CGPA: {cgpa}**, **வருமானம்: Rs. {family_income:,.0f}**, **துறை: {dept}**):\n\n",
                "te": f"### 🎉 మీరు **{len(eligible_schemes)} స్కాలర్‌షిప్‌లకు** అర్హత పొందారు!\n\nమీ ప్రొఫైల్ ఆధారంగా (**CGPA: {cgpa}**, **ఆదాయం: Rs. {family_income:,.0f}**):\n\n",
                "ne": f"### 🎉 तपाईं **{len(eligible_schemes)} छात्रवृत्तिहरूका** लागि योग्य हुनुहुन्छ!\n\nतपाईंको प्रोफाइलको आधारमा (**CGPA: {cgpa}**, **आय: Rs. {family_income:,.0f}**):\n\n",
                "ar": f"### 🎉 أنت مؤهل للحصول على **{len(eligible_schemes)} منح دراسية**!\n\nبناءً على ملفك الشخصي (**المعدل: {cgpa}**، **الدخل: Rs. {family_income:,.0f}**):\n\n",
                "ml": f"### 🎉 നിങ്ങൾ **{len(eligible_schemes)} സ്‌കോളർഷിപ്പുകൾക്ക്** അർഹത നേടിയിട്ടുണ്ട്!\n\nനിങ്ങളുടെ പ്രൊഫൈൽ അടിസ്ഥാനമാക്കി (**CGPA: {cgpa}**, **വരുമാനം: Rs. {family_income:,.0f}**):\n\n"
            }
            res_header = headers.get(language, headers["en"])
            return res_header + schemes_formatted

        return "No eligible scholarships found based on your current profile parameters."

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

        # 2. Check 5-Stage Scholarship Application Lifecycle & Tracking Queries (HIGH PRIORITY)
        query_lower = query.lower()
        from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS
        from database import db

        live_schs = self.get_all_scholarships_live()

        is_lifecycle_query = any(phrase in query_lower for phrase in [
            "5-stage", "5 stage", "five stage", "application lifecycle", "scholarship lifecycle",
            "stages of application", "application stages", "stages of scholarship", "tracking stage",
            "how application is processed", "lifecycle of scholarship", "application status stages",
            "5 steps of scholarship", "application workflow", "verification lifecycle",
            "tracked", "tracking", "track application", "how to track", "how is application tracked",
            "application process stages", "application progress stages"
        ]) or (("lifecycle" in query_lower or "stages" in query_lower or "tracked" in query_lower or "tracking" in query_lower) and any(w in query_lower for w in ["scholarship", "application", "explain", "process"]))

        if is_lifecycle_query:
            res_lifecycle = (
                "### 🔄 Official 5-Stage Scholarship Application Lifecycle\n\n"
                "Every scholarship application submitted through the **Student Portal** is tracked in real-time through **5 distinct verification, approval, and disbursement stages**:\n\n"
                "#### 📝 **Stage 1: Application Submitted & Document Queue**\n"
                "- **Process**: The student fills out personal & academic details, attaches certificates from their **Digital Document Vault** (or uploads new PDFs), and submits the application.\n"
                "- **Portal Status**: `Application Submitted` / `Pending Verification`.\n"
                "- **Action Required**: Wait for institutional review, or submit physical hardcopies if applying under Offline/Hybrid mode.\n\n"
                "#### 🔍 **Stage 2: Institutional Document Verification**\n"
                "- **Process**: The College Scholarship Nodal Officer and Department Committee audit each submitted document (Aadhaar, Marksheets, Income Certificate, Caste Certificate, Bonafide, Bank Passbook).\n"
                "- **Outcomes**:\n"
                "  - ✅ **Approved**: Documents verified successfully; application advances to Stage 3.\n"
                "  - 🔄 **Rejection / Correction**: If a document is defective, the admin provides an official explanation, and the student is notified via email/portal to re-upload.\n"
                "- **Portal Status**: `Documents Verified`.\n\n"
                "#### ✍️ **Stage 3: Institutional Approval & Signature**\n"
                "- **Process**: The College Principal / Head of Institution officially approves, signs, and stamps the verified candidate dossier.\n"
                "- **Portal Status**: `Processed & Signed by Institute`.\n"
                "- **Notification**: Student receives an automated email confirmation of institutional endorsement.\n\n"
                "#### 🏛️ **Stage 4: Forwarded to Government / Provider Authority**\n"
                "- **Process**: The endorsed application batch is transmitted to the State Welfare Department / AICTE / National Scholarship Portal (NSP) for quota sanctioning.\n"
                "- **Portal Status**: `Submitted to Government Authority`.\n\n"
                "#### 💳 **Stage 5: Direct Benefit Transfer (DBT) Disbursement**\n"
                "- **Process**: The Government / Funding Agency releases the approved scholarship funds directly into the student's Aadhaar-seeded bank account via PFMS / DBT.\n"
                "- **Portal Status**: `Amount Received (DBT)` / `Disbursed`.\n"
                "- **Confirmation**: Student receives SMS and transaction reference receipt.\n\n"
                "---\n"
                "📌 **How to Track Live Progress**:\n"
                "Visit the **Applications** (`/dashboard/applications`) tab in your Student Dashboard to view the interactive 5-stage progress timeline, rejection notes (if any), and full audit history logs for each of your applications!"
            )
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": res_lifecycle})
            return res_lifecycle, context

        # 3. Check Document / Certificate / Required Papers Queries (HIGH PRIORITY)

        doc_keywords = [
            "document", "documents", "doc", "docs", "certificate", "certificates",
            "checklist", "papers", "paper", "proof", "proofs", "attestation",
            "necessary document", "necessary documents", "documents needed", "documents required",
            "required documents", "what documents", "which documents", "docs required",
            "enna documents", "documents venum", "documents kavaali", "kya document",
            "upload documents", "document verification"
        ]
        is_doc_intent = any(k in query_lower for k in doc_keywords) or any(phrase in query_lower for phrase in [
            "what to submit", "what should i upload", "upload requirements", "documents list", "documents checklist"
        ])

        if is_doc_intent:
            # Check if user asked about a specific scholarship scheme's documents
            matched_sch = None
            for sdata in live_schs:
                sname = sdata.get("scholarship_name", "").lower()
                sid = sdata.get("id", "").lower()
                if sid in query_lower or sname in query_lower:
                    matched_sch = sdata
                    break
                # Match distinct multi-word identifiers
                keywords = [w for w in sname.split() if len(w) > 4 and w not in ["scholarship", "scheme", "students", "national", "central", "state"]]
                if len(keywords) >= 2 and all(kw in query_lower for kw in keywords[:2]):
                    matched_sch = sdata
                    break
                elif len(keywords) == 1 and keywords[0] in query_lower and len(keywords[0]) > 5:
                    matched_sch = sdata
                    break

            if matched_sch:
                portal_url = matched_sch.get("official_website") or matched_sch.get("application_portal_url") or matched_sch.get("application_url") or "https://scholarships.gov.in"
                if not portal_url.startswith("http"):
                    portal_url = "https://scholarships.gov.in"
                docs_list = matched_sch.get("necessary_documents") or matched_sch.get("documents") or ["Aadhaar Card", "Marksheets", "Income Certificate", "Bonafide Certificate"]
                docs_formatted = "\n".join([f"  - 📄 **{d}**" for d in docs_list])
                res = (
                    f"### 📋 Mandatory Required Documents for **{matched_sch['scholarship_name']}**\n\n"
                    f"To apply for this scholarship on the Student Portal, you must attach the following verified official documents:\n\n"
                    f"{docs_formatted}\n\n"
                    f"⚡ **Direct Application & Submission**:\n"
                    f"1. You can attach these files directly from your **Digital Document Vault** or upload new PDFs during application.\n"
                    f"2. 👉 [Apply Directly on Official Portal]({portal_url})"
                )
                context["history"].append({"role": "user", "text": query})
                context["history"].append({"role": "bot", "text": res})
                return res, context

            # General Comprehensive Document Checklist
            res_doc = (
                "### 📋 Mandatory Documents Checklist for Scholarship Applications\n\n"
                "To apply for scholarships and pass Institutional / Government Document Verification, students must upload clear scanned copies of the following official documents:\n\n"
                "#### 1. 🪪 Identity & Government Verification\n"
                "- 📄 **Aadhaar Card** (Must be linked with active mobile number and bank account for DBT subsidy)\n"
                "- 🖼️ **Recent Passport-Size Photograph**\n\n"
                "#### 2. 🎓 Academic & Institutional Records\n"
                "- 📊 **Class 10th (SSC) & 12th (HSC) Mark Sheets** / Diploma Pass Certificate\n"
                "- 🏫 **College Bonafide Certificate & Current Academic Year Fee Receipt** (Issued by Principal / Registrar)\n"
                "- 📈 **Latest Semester Grade Sheets** (Showing qualifying CGPA with zero active backlogs)\n\n"
                "#### 3. 💵 Financial & Quota Verification\n"
                "- 💰 **Annual Family Income Certificate** (Issued by Revenue Authority / Tehsildar / Tahsildar within the current financial year)\n"
                "- 👥 **Community / Caste Certificate** (Mandatory for SC / ST / BC / MBC / EWS / Minority category schemes)\n\n"
                "#### 4. 🏦 Banking & DBT Direct Benefit Transfer\n"
                "- 🏛️ **Student Bank Account Passbook Copy / Cancelled Cheque** (First page showing Account Holder Name, Account No, and IFSC Code)\n\n"
                "#### 5. 🌟 Specialized Scheme Certificates (If Applicable)\n"
                "- 🎓 **First Generation Graduate Certificate** (For Tamil Nadu / State First Graduate tuition fee concession schemes)\n"
                "- ♿ **Disability / PwD Certificate (UDID Card)** (For benchmark disability ≥ 40%)\n"
                "- 🏅 **Sports / Cultural Achievement Certificates** (For state/national level sports scholarships)\n\n"
                "📌 **How to Upload & Apply**:\n"
                "1. Visit the **Digital Document Vault** (`/dashboard/documents`) tab to upload and manage your verified files.\n"
                "2. Go to the **Scholarships Hub** (`/dashboard/scholarships`) tab, select your eligible scheme, and click **⚡ Apply Online**!"
            )
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": res_doc})
            return res_doc, context
        
        # 3. Check Count & Stats Queries
        count_keywords = ["how many", "how much", "total number", "count of", "total count", "list all"]
        sch_typos = ["scholarship", "scholarships", "scolorship", "scolorships", "scholorship", "schalorship", "stipend", "fee waiver"]
        is_count_query = any(ck in query_lower for ck in count_keywords) and any(st in query_lower for st in sch_typos)

        if is_count_query:
            total_schemes = len(live_schs)
            res_msg = (
                f"### 🎓 Total Scholarships Provided ({total_schemes} Verified Schemes)\n\n"
                f"Our **Student Portal & Campus Support System** provides **{total_schemes} official scholarship schemes** organized under **14 distinct categories** (including AICTE, Central Govt NSP, State Govt, Merit-based, Need-based, Girl Student initiatives, and Corporate CSR grants).\n\n"
                f"📌 **How to View & Apply**: Navigate to the **Scholarships Hub** tab in your Student Dashboard to check eligibility against your profile, view document checklists, and **download application forms**!"
            )
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": res_msg})
            return res_msg, context

        # 4. Check category-specific queries (with word boundaries to avoid false substring matching)
        cat_matched = None
        if re.search(r'\baicte\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 3), None)
        elif re.search(r'\b(central\s+gov|central\s+sector|nsp|national\s+scholarship)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 1), None)
        elif re.search(r'\b(category[- ]based|caste|minority|\bsc\b|\bst\b|\bobc\b|\bmbc\b)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 2), None)
        elif re.search(r'\b(state\s+gov|state\s+scholarship)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 4), None)
        elif re.search(r'\b(merit[- ]based|\bmerit\b|academic\s+excellence|topper)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 5), None)
        elif re.search(r'\b(need[- ]based|financial\s+need|financial\s+hardship|economically\s+backward|\bebc\b|\bews\b)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 6), None)
        elif re.search(r'\b(girl|girls|female|women|pragati)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 7), None)
        elif re.search(r'\b(pwd|disability|disabled|handicapped|saksham)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 8), None)
        elif re.search(r'\b(institutional|alumni|college\s+scholarship)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 9), None)
        elif re.search(r'\b(sports|athlete|sports\s+quota)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 10), None)
        elif re.search(r'\b(research|innovation|hackathon|patent)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 11), None)
        elif re.search(r'\b(international|study\s+abroad|foreign)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 12), None)
        elif re.search(r'\b(corporate|csr|reliance|hdfc|private\s+scholarship)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 13), None)
        elif re.search(r'\b(loan\s+subsidy|interest\s+subsidy|csis)\b', query_lower):
            cat_matched = next((c for c in SCHOLARSHIP_CATEGORIES if c["id"] == 14), None)

        if cat_matched:
            cat_schs = [s for s in live_schs if s.get("category_id") == cat_matched["id"]]
            if cat_schs:
                sch_lines = []
                for idx, s in enumerate(cat_schs, 1):
                    cgpa_str = f"Min CGPA: {s['min_gpa']}" if s.get("min_gpa") else "No min CGPA"
                    inc_str = f"Max Income: Rs. {(s['max_income']/100000):.1f}L/yr" if s.get("max_income") else "No income limit"
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

        # 5. Check general 14 scholarship categories overview
        general_sch_keywords = [
            "14 categories", "14 category", "categories", "types of scholarship", "categories of scholarship",
            "scholarship categories", "14 types", "general overview", "list of categories",
            "14 scholarship", "14 scholarships", "14 scolorship", "14 scolorships", "14 schalorship", "14 schalorships",
            "14 scheme", "14 schemes", "14 list", "fourteen scholarships", "fourteen categories", "all 14", "list 14",
            "show 14", "14 details", "14 scholarship details", "14 scolorship details", "14 scholorship details"
        ]
        has_14 = bool(re.search(r'\b14\b', query_lower))
        has_sch_word = any(w in query_lower for w in ["scholarship", "scholarships", "scolorship", "scolorships", "category", "categories", "scheme", "schemes", "type", "types", "detail", "details"])

        is_general_overview = any(k in query_lower for k in general_sch_keywords) or (has_14 and has_sch_word) or query_lower.strip() in [
            "scholarship", "scholarships", "scolorship", "scolorships", "scholarship details", "scholarships details", "categories", "14", "14 scholarship", "14 scholarships"
        ]

        if is_general_overview and not any(w in query_lower for w in ["eligible", "eligibility", "qualify", "kidaikuma"]):
            if "scholarship_check" in context:
                del context["scholarship_check"]

            cat_lines = []
            for c in SCHOLARSHIP_CATEGORIES:
                icon_sym = c.get("icon", "🎓")
                cat_schs = [s for s in live_schs if s.get("category_id") == c["id"]]
                sch_names = [s.get("scholarship_name") for s in cat_schs if s.get("scholarship_name")]
                sch_str = f"\n  - 📜 **Schemes Available**: " + ", ".join([f"`{name}`" for name in sch_names]) if sch_names else "\n  - 📜 *Schemes Available*: Verified Portal Schemes"
                cat_lines.append(f"**Category #{c['id']} - {icon_sym} {c['name']}**\n- 💡 {c['description']}{sch_str}")

            cat_list_str = "\n\n".join(cat_lines)
            total_live_count = len(live_schs)
            
            res_msg = (
                f"### 🎓 Official 14 Categories of Scholarships ({total_live_count} Active Portal Schemes)\n\n"
                f"Indian students pursuing UG degree courses (B.E./B.Tech, B.Sc., B.Com., B.A., MBBS, B.Pharm, Law, etc.) can explore and apply under **14 distinct verified categories**:\n\n"
                f"{cat_list_str}\n\n"
                f"📌 **How to Apply & Download Forms**: Navigate to the **Scholarships Hub** (`/dashboard/scholarships`) tab in your Student Dashboard. Select any Category to view complete eligibility criteria, mandatory document checklists, and **download official application forms** protected by Double Passkey security!"
            )
            context["history"].append({"role": "user", "text": query})
            context["history"].append({"role": "bot", "text": res_msg})
            return res_msg, context

        # 6. Check eligibility & individual scholarship queries (English, Tanglish, Hinglish, Tenglish)
        is_eligibility_intent = any(k in query_lower for k in [
            "eligible", "eligibility", "qualification", "apply for", "can i get", "qualify", "for me", "which all", "what scholarships",
            "kidaikuma", "kidaikkum", "apply panalama", "apply panna", "iruku", "panlam", "mudiyuma", "varusathuku",
            "kaise milega", "milegi", "chahiye", "kaunsi", "naku", "vasthunda", "vasthundi"
        ])
        is_scholarship_intent = any(k in query_lower for k in [
            "scholarship", "scholarships", "scolorship", "scolorships", "scholorship", "schalorship", "stipend", "aid", "fee waiver", "grant"
        ])

        if is_eligibility_intent or is_scholarship_intent:
            student_id = context.get("user_id", "")
            try:
                student_doc = db.collection("students").document(student_id).get() if student_id else None
                student_profile = student_doc.to_dict() if (student_doc and student_doc.exists) else {}
            except Exception:
                student_profile = {}

            is_all_eligible_query = any(phrase in query_lower for phrase in [
                "which all am i eligible", "what scholarships am i eligible", "which scholarships am i eligible",
                "am i eligible", "what am i eligible", "eligible for me", "scholarships for me",
                "check my eligibility", "my eligibility", "which scholarships can i apply",
                "which scholarships can i get", "what scholarships can i get", "scholarships i qualify",
                "qualify for me", "show eligible scholarships for me", "all eligible scholarships for me",
                "enaku enna scholarship", "enna scholarship kidaikkum", "enna scholarship apply panlam",
                "mujhe konsi scholarship", "naku em scholarship", "list the scholarships", "list scholarships",
                "give me eligible scholarship", "give eligible scholarship", "give me scholarship",
                "show scholarships", "show all scholarships", "all scholarships", "list of scholarships",
                "get scholarships", "scholarship list", "tell me scholarships"
            ]) or (("eligible" in query_lower or "kidaikkum" in query_lower or "kidaikuma" in query_lower or "scholarship" in query_lower or "scholarships" in query_lower) and any(w in query_lower for w in ["i", "me", "my", "enaku", "naan", "mujhe", "naku", "list", "give", "show", "all"]))

            matched_sch = None
            for sdata in live_schs:
                sname = sdata.get("scholarship_name", "").lower()
                sid = sdata.get("id", "").lower()
                if sid in query_lower or sname in query_lower:
                    matched_sch = sdata
                    break
                keywords = [w for w in sname.split() if len(w) > 4 and w not in ["scholarship", "scheme", "students", "national", "central", "state"]]
                if len(keywords) >= 2 and all(kw in query_lower for kw in keywords[:2]):
                    matched_sch = sdata
                    break
                elif len(keywords) == 1 and keywords[0] in query_lower and len(keywords[0]) > 5:
                    matched_sch = sdata
                    break

            if is_all_eligible_query or not matched_sch:
                res = self.get_all_eligible_scholarships(student_profile, language)
                context["history"].append({"role": "user", "text": query})
                context["history"].append({"role": "bot", "text": res})
                return res, context

            if matched_sch:
                portal_url = matched_sch.get("official_website") or matched_sch.get("application_portal_url") or matched_sch.get("application_url") or "https://scholarships.gov.in"
                if not portal_url.startswith("http"):
                    portal_url = "https://scholarships.gov.in"

                if any(k in query_lower for k in ["form", "download", "application form", "apply", "link", "website"]):
                    res = (
                        f"### ⚡ Apply Online for **{matched_sch['scholarship_name']}**\n\n"
                        f"You can apply directly on the official scholarship application website:\n\n"
                        f"👉 [Apply Directly on Official Portal]({portal_url})\n\n"
                        f"📌 You can also click **⚡ Apply Online** on this scholarship card in the **Scholarships Hub** to open the official website and automatically track your submission in real-time."
                    )
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": res})
                    return res, context

                res = self.format_full_scholarship_details(matched_sch)
                context["history"].append({"role": "user", "text": query})
                context["history"].append({"role": "bot", "text": res})
                return res, context

        # 5. Fast Greeting Handler
        if query_lower in ["hi", "hello", "hey", "namaste", "good morning", "good afternoon", "hlo", "hi there", "hola", "vanakkam", "namaskaram"]:
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

        # 6. Standard RAG fallback with Dynamic DB & Uploaded Circular Knowledge Extraction
        detected_lang = language or "en"
        if len(query.strip()) > 20:
            try:
                auto_d = detect(query)
                if auto_d in ["en", "hi", "ta", "te", "ne", "ar", "ml"]:
                    detected_lang = auto_d
            except:
                pass
            
        context_str = ""
        search_query = query
        for noise_word in ["enaku", "kidaikuma", "kidaikkum", "apply panalama", "panlam", "mujhe", "milegi", "kaise"]:
            if noise_word in query_lower:
                search_query = search_query + " scholarship eligibility rules criteria circular"

        # 1. Search Vector DB (Circulars & Uploaded Documents)
        if self.retriever:
            try:
                retrieved_docs = self.retriever.invoke(search_query)
                if retrieved_docs:
                    context_str = "\n\n".join([doc.page_content for doc in retrieved_docs if doc.page_content.strip()])
            except Exception as e:
                logger.error(f"RAG retrieval error: {e}")

        # Direct file fallback for uploaded circulars
        if not context_str and os.path.exists(DOCS_DIR):
            try:
                matched_chunks = []
                query_terms = [w for w in re.findall(r'\b\w+\b', query_lower) if len(w) > 3 and w not in ["what", "when", "which", "where", "how", "tell", "explain", "about"]]
                for fname in os.listdir(DOCS_DIR):
                    fpath = os.path.join(DOCS_DIR, fname)
                    if os.path.isfile(fpath) and fname.endswith((".txt", ".md", ".json")):
                        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                            txt_content = f.read()
                        if any(term in txt_content.lower() for term in query_terms) or any(term in fname.lower() for term in query_terms):
                            matched_chunks.append(f"📄 **Circular / Document ({fname})**:\n{txt_content}")
                if matched_chunks:
                    context_str = "\n\n".join(matched_chunks[:3])
            except Exception as fe:
                logger.error(f"Direct circular scan error: {fe}")

        # 2. Dynamic DB Enrichment (Real-time Firestore Schemes & Circular Notices)
        try:
            if any(w in query_lower for w in ["scholarship", "scolorship", "stipend", "fee", "income", "cgpa", "gpa"]):
                sch_docs = list(db.collection("scholarships").limit(8).stream())
                if sch_docs:
                    db_facts = []
                    for sd in sch_docs:
                        s_info = sd.to_dict()
                        db_facts.append(f"Scholarship: {s_info.get('scholarship_name')} | Min CGPA: {s_info.get('min_gpa', 'None')} | Max Income: {s_info.get('max_income', 'None')} | Benefits: {s_info.get('benefits', '')}")
                    context_str = "\n".join(db_facts) + ("\n\n" + context_str if context_str else "")
        except Exception:
            pass

        # If neural model is available, perform generation
        # If neural model is available, perform generation
        if self.tokenizer is not None and self.model is not None:
            try:
                system_instructions = {
                    "hi": "Aap ek college sahayak bot hain. Dee gayi jaankari ke aadhar par uttar dein.",
                    "en": "You are a helpful college assistant bot. Answer the question accurately using the provided ground-truth context.",
                    "ta": "Neengal oru college udhavi bot. Kodukkappatta context-in adippadayil pathilalikkavum.",
                    "te": "Meeru sahayakaramaina college sahayaka bot. Andhinchina context aadharanga samadhanam ivvandi."
                }
                sys_prompt = system_instructions.get(detected_lang, system_instructions["en"])
                sys_prompt += f" Respond accurately in '{detected_lang}' or clear English."

                start_tok = "<|im_start|>"
                end_tok = "<|im_end|>"
                prompt = f"{start_tok}system\n{sys_prompt}\nContext: {context_str}{end_tok}\n"
                for turn in context.get("history", [])[-8:]:
                    role = turn["role"]
                    text = turn["text"]
                    prompt += f"{start_tok}{role}\n{text}{end_tok}\n"
                prompt += f"{start_tok}user\n{query}{end_tok}\n{start_tok}assistant\n"
                
                inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
                outputs = self.model.generate(**inputs, max_new_tokens=256, temperature=0.2, repetition_penalty=1.1)
                raw_response = self.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True, clean_up_tokenization_spaces=True)
                clean_response = raw_response.encode("utf-8", errors="replace").decode("utf-8", errors="ignore").strip()
                if clean_response:
                    context["history"].append({"role": "user", "text": query})
                    context["history"].append({"role": "bot", "text": clean_response})
                    return clean_response, context
            except Exception as ge:
                logger.error(f"Neural generation error: {ge}")

        # Deterministic / High-Availability RAG Knowledge Synthesizer
        if context_str.strip():
            rag_lines = [line.strip() for line in context_str.split("\n") if line.strip() and not line.startswith("Scholarship:")]
            if rag_lines:
                rag_summary = "\n\n".join(rag_lines[:5])
                fallback_res = (
                    f"### 📄 Official Campus Knowledge Base & Circulars\n\n"
                    f"{rag_summary}\n\n"
                    f"📌 *Note: This information is retrieved directly from official campus circulars and policy guidelines.*"
                )
            else:
                fallback_res = (
                    f"### 🎓 Campus Scholarship Information\n\n"
                    f"{context_str}\n\n"
                    f"📌 *For application submission and document upload, please check the **Scholarships Hub** and **Digital Document Vault** in your portal.*"
                )
        else:
            fallback_res = (
                f"I received your query: **'{query}'**.\n\n"
                f"To find relevant information:\n"
                f"1. Check the **Scholarships Hub** (`/dashboard/scholarships`) for all verified active schemes.\n"
                f"2. Visit the **Digital Document Vault** (`/dashboard/documents`) for mandatory certificate requirements.\n"
                f"3. Check the **Circulars & Notifications** feed for official administrative memos.\n"
                f"4. Contact the **College Scholarship Cell (Room 102)** or call `0120-6619540` for direct nodal assistance."
            )
        
        context["history"].append({"role": "user", "text": query})
        context["history"].append({"role": "bot", "text": fallback_res})
        return fallback_res, context

bot = None

def get_bot():
    global bot
    if bot is None:
        bot = CollegeChatbot()
    return bot
