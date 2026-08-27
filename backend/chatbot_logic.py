import os
import traceback

def predict_response(message, language="en", context=None):
    """
    Routes the query to the Qwen LLM which handles its own RAG retrieval and context checks.
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
        print(f"Qwen Chatbot Error / Fallback: {e}")
        traceback.print_exc()

        fallback_res = (
            f"### 🎓 Campus Scholarship Information\n\n"
            f"Thank you for your query: **'{message}'**.\n\n"
            f"Here is guidance for your request:\n\n"
            f"1. 🏛️ **Scholarships Hub** (`/dashboard/scholarships`): Explore all 14 official scholarship categories, eligibility rules, and application links.\n"
            f"2. 📄 **Digital Document Vault** (`/dashboard/documents`): Download required certificate formats and check document verification guidelines.\n"
            f"3. 🔄 **5-Stage Application Tracking** (`/dashboard/applications`): Monitor real-time status and institutional verification progress.\n"
            f"4. 📞 **Helpline & Assistance**: Contact Room 102 (Scholarship Cell) or call `0120-6619540` / `1800-118-005`."
        )
        context["history"].append({"role": "user", "text": message})
        context["history"].append({"role": "bot", "text": fallback_res})
        return fallback_res, context


if __name__ == "__main__":
    # Test
    res, _ = predict_response("Hello", "en")
    print(res[:100])

