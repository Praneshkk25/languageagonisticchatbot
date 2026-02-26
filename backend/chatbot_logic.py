
import json
import numpy as np
import pickle
import random
import os
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Global resources
model = None
tokenizer = None
classes = []
intents = {}

def load_advanced_resources():
    global model, tokenizer, classes, intents
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    model_path = os.path.join(BASE_DIR, 'chatbot_model_advanced.h5')
    tokenizer_path = os.path.join(BASE_DIR, 'tokenizer.pkl')
    classes_path = os.path.join(BASE_DIR, 'classes_advanced.pkl')
    intents_path = os.path.join(BASE_DIR, 'intents.json')

    if all(os.path.exists(p) for p in [model_path, tokenizer_path, classes_path, intents_path]):
        model = load_model(model_path)
        with open(tokenizer_path, 'rb') as f:
            tokenizer = pickle.load(f)
        with open(classes_path, 'rb') as f:
            classes = pickle.load(f)
        with open(intents_path, encoding='utf-8') as f:
            intents = json.load(f)
        print("Advanced DL Model loaded successfully")
    else:
        print("Advanced Model resources not found. Use train_advanced.py.")

try:
    load_advanced_resources()
except Exception as e:
    print(f"Error loading resources: {e}")

def predict_class(sentence):
    if not model or not tokenizer:
        return [{"intent": "error", "probability": "1.0"}]
    
    MAX_LEN = 15
    # Preprocess text (AI-style NLP)
    sequence = tokenizer.texts_to_sequences([sentence.lower()])
    padded = pad_sequences(sequence, maxlen=MAX_LEN, padding='post', truncating='post')
    
    # Predict using the Hybrid CNN-BiLSTM model
    prediction = model.predict(padded, verbose=0)[0]
    
    # Get top prediction
    idx = np.argmax(prediction)
    prob = prediction[idx]
    
    ERROR_THRESHOLD = 0.40 # Confidence threshold
    
    if prob > ERROR_THRESHOLD:
        return [{"intent": classes[idx], "probability": str(prob)}]
    else:
        return [{"intent": "unknown", "probability": str(prob)}]

def get_response(intents_list, lang="en"):
    if not intents_list or intents_list[0]['intent'] == "unknown":
        return "I'm sorry, I don't quite understand that. Could you rephrase?"
        
    tag = intents_list[0]['intent']
    for i in intents['intents']:
        if i['tag'] == tag:
            responses = i['responses']
            if isinstance(responses, dict):
                return responses.get(lang, responses.get("en", "Language not supported"))
            return random.choice(responses)
            
    return "I am still learning about that topic."

def predict_response(message, language="en"):
    # Hybrid Approach: DL Classification + RAG Fallback
    ints = predict_class(message)
    
    # Rule 1: Use DL Model if confident
    if ints[0]['intent'] != "unknown":
        res = get_response(ints, language)
        return res
    
    # Rule 2: Fallback to Learning System (RAG) for "AI-like" understanding
    try:
        from utils_learning import learning_system
        contexts = learning_system.find_relevant_context(message)
        if contexts:
            # Simulated Generative Response: Formatting the retrieved context
            return f"Based on what I know: {contexts[0]}"
    except Exception as e:
        print(f"RAG Error: {e}")

    return "I'm sorry, I couldn't find specific information on that. Please contact our support desk."

if __name__ == "__main__":
    # Test
    print(predict_response("Hello", "en"))
    print(predict_response("Tell me about Sona", "en"))
