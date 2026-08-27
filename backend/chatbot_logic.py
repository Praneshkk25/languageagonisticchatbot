import os
import traceback
import re

def predict_response(message, language="en", context=None):
    """
    Routes the query to the Qwen LLM which handles its own RAG retrieval and context checks.
    Includes a resilient, smart fallback engine so no query ever returns generic boilerplate text.
    """
    if context is None:
        context = {}
    if "history" not in context:
        context["history"] = []

    try:
        from qwen_logic import get_bot
        bot = get_bot()
        return bot.process_query(message, language, context)
    except Exception as e:
        print(f"[WARNING] Qwen Chatbot Engine Exception caught in predict_response: {e}")
        traceback.print_exc()

        msg_lower = (message or "").lower().strip()

        # Resilient Standalone Query Router for Fail-Safe execution
        try:
            from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS
        except Exception:
            SCHOLARSHIP_CATEGORIES = []
            ALL_SCHOLARSHIPS = []

        # 1. Check 14 Categories / 14 Scholarships
        has_14 = bool(re.search(r'\b14\b', msg_lower))
        has_sch_words = any(w in msg_lower for w in ["scholarship", "scholarships", "scolorship", "scolorships", "category", "categories", "scheme", "schemes", "type", "types", "detail", "details"])
        is_14_query = (has_14 and has_sch_words) or any(k in msg_lower for k in [
            "14 categories", "14 category", "14 scholarship", "14 scholarships", "14 scolorship", "categories of scholarship",
            "scholarship categories", "types of scholarship", "list 14", "all 14", "14 details"
        ]) or msg_lower in ["14", "categories", "scholarship", "scholarships"]

        if is_14_query:
            cat_lines = []
            for c in SCHOLARSHIP_CATEGORIES:
                icon_sym = c.get("icon", "🎓")
                cat_schs = [s for s in ALL_SCHOLARSHIPS if s.get("category_id") == c.get("id")]
                sch_names = [s.get("scholarship_name") for s in cat_schs if s.get("scholarship_name")]
                sch_str = f"\n  - 📜 **Schemes Available**: " + ", ".join([f"`{name}`" for name in sch_names]) if sch_names else ""
                cat_lines.append(f"**Category #{c.get('id')} - {icon_sym} {c.get('name')}**\n- 💡 {c.get('description')}{sch_str}")

            cat_str = "\n\n".join(cat_lines) if cat_lines else "Explore all 14 official categories in your dashboard."
            res_msg = (
                f"### 🎓 Official 14 Categories of Scholarships (Undergraduate Student Portal)\n\n"
                f"Indian students pursuing UG degree courses (B.E./B.Tech, B.Sc., B.Com., B.A., MBBS, B.Pharm, Law, etc.) can explore and apply under **14 distinct verified categories**:\n\n"
                f"{cat_str}\n\n"
                f"📌 **How to Apply & Download Forms**: Navigate to the **Scholarships Hub** (`/dashboard/scholarships`) tab in your Student Dashboard. Select any Category to view complete eligibility criteria, mandatory document checklists, and **download official application forms** protected by Double Passkey security!"
            )
            context["history"].append({"role": "user", "text": message})
            context["history"].append({"role": "bot", "text": res_msg})
            return res_msg, context

        # 2. Check Document Checklist
        if any(k in msg_lower for k in ["document", "documents", "doc", "docs", "certificate", "certificates", "checklist", "paper", "papers", "proof"]):
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
                "📌 **How to Upload & Apply**:\n"
                "1. Visit the **Digital Document Vault** (`/dashboard/documents`) tab to upload and manage your verified files.\n"
                "2. Go to the **Scholarships Hub** (`/dashboard/scholarships`) tab, select your eligible scheme, and click **⚡ Apply Online**!"
            )
            context["history"].append({"role": "user", "text": message})
            context["history"].append({"role": "bot", "text": res_doc})
            return res_doc, context

        # 3. Check Deadlines
        if any(k in msg_lower for k in ["deadline", "deadlines", "last date", "closing date", "due date", "when to apply"]):
            res_dl = (
                "### 📅 Official Scholarship Application Deadlines & Schedule (2025-2026 Academic Year)\n\n"
                "Here are the important deadlines across verified scholarship categories in your Student Portal:\n\n"
                "#### 1. 🏛️ **Central Govt & NSP Schemes** (PM-USP, CSSS, Ishan Uday)\n"
                "- ⏰ **Student Submission Cutoff**: **March 31, 2026 (5:00 PM)**\n"
                "- 🔍 **Institute Verification**: April 15, 2026\n\n"
                "#### 2. 👥 **State Govt & Category-Based Schemes** (Post-Matric SC/ST/BC/MBC, First Generation)\n"
                "- ⏰ **Student Submission Cutoff**: **April 30, 2026**\n"
                "- 🔍 **District Nodal Verification**: May 15, 2026\n\n"
                "#### 3. ⚡ **AICTE & Specialized Schemes** (Pragathi, Saksham, Swanath)\n"
                "- ⏰ **Student Submission Cutoff**: **March 31, 2026**\n\n"
                "📌 **Pro-Tip**: Submit your application at least **1 week before the deadline** to allow your Department Nodal Officer adequate time to verify uploaded certificates in your **Digital Vault**!"
            )
            context["history"].append({"role": "user", "text": message})
            context["history"].append({"role": "bot", "text": res_dl})
            return res_dl, context

        # 4. Check 5-Stage Lifecycle
        if any(k in msg_lower for k in ["5-stage", "5 stage", "lifecycle", "stages", "tracking", "track"]):
            res_life = (
                "### 🔄 Official 5-Stage Scholarship Application Lifecycle\n\n"
                "Every scholarship application submitted through the **Student Portal** is tracked in real-time through **5 distinct verification, approval, and disbursement stages**:\n\n"
                "#### 📝 **Stage 1: Application Submitted & Document Queue**\n"
                "- **Process**: Student fills out details, attaches certificates from **Digital Vault**, and submits.\n"
                "#### 🔍 **Stage 2: Institutional Document Verification**\n"
                "- **Process**: Scholarship Nodal Officer audits Aadhaar, Marksheets, Income, Caste, and Bonafide.\n"
                "#### ✍️ **Stage 3: Institutional Approval & Signature**\n"
                "- **Process**: Principal / Head of Institution approves and digitally signs the dossier.\n"
                "#### 🏛️ **Stage 4: Forwarded to Government / Provider Authority**\n"
                "- **Process**: Application batch transmitted to State Welfare Dept / AICTE / NSP.\n"
                "#### 💳 **Stage 5: Direct Benefit Transfer (DBT) Disbursement**\n"
                "- **Process**: Govt releases funds directly into student's Aadhaar-seeded bank account.\n\n"
                "📌 **How to Track**: Visit the **Applications** (`/dashboard/applications`) tab in your Student Dashboard to view interactive timeline progress!"
            )
            context["history"].append({"role": "user", "text": message})
            context["history"].append({"role": "bot", "text": res_life})
            return res_life, context

        # 5. Fallback for all other queries
        res_default = (
            f"### 🎓 Student Portal Assistant\n\n"
            f"I have received your request: **'{message}'**.\n\n"
            f"Here is how you can manage your scholarship requirements on the portal:\n\n"
            f"1. 🏆 **Explore All 14 Categories**: Visit the **Scholarships Hub** (`/dashboard/scholarships`) to view criteria, benefits, and apply online.\n"
            f"2. 📄 **Document Verification**: Upload mandatory certificates to your **Digital Document Vault** (`/dashboard/documents`).\n"
            f"3. 🔄 **Track Applications**: Check real-time 5-stage verification status under **Applications** (`/dashboard/applications`).\n"
            f"4. 📞 **Nodal Assistance**: Contact the **College Scholarship Cell (Room 102)** or helpline `0120-6619540` for direct support."
        )
        context["history"].append({"role": "user", "text": message})
        context["history"].append({"role": "bot", "text": res_default})
        return res_default, context


if __name__ == "__main__":
    res, _ = predict_response("14 Scholarship Categories", "en")
    print(res[:200])
