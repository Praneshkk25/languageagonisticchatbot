
import json
import numpy as np
import pickle
import nltk
from nltk.stem import WordNetLemmatizer
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

lemmatizer = WordNetLemmatizer()

def evaluate():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, 'chatbot_model.h5')
    
    if not os.path.exists(model_path):
        print("Model not found.")
        return

    model = load_model(model_path)
    words = pickle.load(open(os.path.join(BASE_DIR, 'words.pkl'), 'rb'))
    classes = pickle.load(open(os.path.join(BASE_DIR, 'classes.pkl'), 'rb'))
    with open(os.path.join(BASE_DIR, 'intents.json'), encoding='utf-8') as f:
        data = json.load(f)

    documents = []
    for intent in data['intents']:
        for pattern in intent['patterns']:
            w = nltk.word_tokenize(pattern)
            documents.append((w, intent['tag']))

    training = []
    output_empty = [0] * len(classes)

    for doc in documents:
        bag = []
        pattern_words = doc[0]
        pattern_words = [lemmatizer.lemmatize(word.lower()) for word in pattern_words]
        for w in words:
            bag.append(1) if w in pattern_words else bag.append(0)
        
        output_row = list(output_empty)
        output_row[classes.index(doc[1])] = 1
        training.append([bag, output_row])

    training = np.array(training, dtype=object)
    test_x = list(training[:, 0])
    test_y = list(training[:, 1])

    loss, accuracy = model.evaluate(np.array(test_x), np.array(test_y), verbose=0)
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print(f"Loss: {loss:.4f}")
    
    print("\nModel Details:")
    model.summary()

if __name__ == "__main__":
    evaluate()
