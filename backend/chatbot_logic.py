import os
from qwen_logic import get_bot

def predict_response(message, language="en"):
    """
    Routes the query to the Qwen LLM which handles its own RAG retrieval.
    """
    try:
        bot = get_bot()
        return bot.process_query(message, language)
    except Exception as e:
        print(f"Qwen Chatbot Error: {e}")
        return "I'm having trouble connecting to my brain right now. Please try again later."

if __name__ == "__main__":
    # Test
    print(predict_response("Hello", "en"))
    print(predict_response("Tell me about Sona", "en"))
