import os

def predict_response(message, language="en", context=None):
    """
    Routes the query to the Qwen LLM which handles its own RAG retrieval and context checks.
    """
    try:
        from qwen_logic import get_bot
        bot = get_bot()
        return bot.process_query(message, language, context)
    except Exception as e:
        print(f"Qwen Chatbot Error / Fallback: {e}")
        return f"I received your query: '{message}'. For scholarships, deadlines, and circulars, check the respective tabs.", context


if __name__ == "__main__":
    # Test
    print(predict_response("Hello", "en"))
    print(predict_response("Tell me about Sona", "en"))
