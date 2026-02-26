import json
import numpy as np
import pickle
import nltk
from nltk.stem import WordNetLemmatizer
import random
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import SGD
import os

lemmatizer = WordNetLemmatizer()

def train_model():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    print("Loading intents...")
    with open(os.path.join(BASE_DIR, 'intents.json'), encoding='utf-8') as f:
        data = json.load(f)

    words = []
    classes = []
    documents = []
    ignore_words = ['?', '!', '.', ',']

    for intent in data['intents']:
        for pattern in intent['patterns']:
            w = nltk.word_tokenize(pattern)
            words.extend(w)
            documents.append((w, intent['tag']))
            if intent['tag'] not in classes:
                classes.append(intent['tag'])

    words = [lemmatizer.lemmatize(w.lower()) for w in words if w not in ignore_words]
    words = sorted(list(set(words)))
    classes = sorted(list(set(classes)))

    print(f"{len(documents)} documents")
    print(f"{len(classes)} classes", classes)
    print(f"{len(words)} unique lemmatized words", words)

    pickle.dump(words, open(os.path.join(BASE_DIR, 'words.pkl'),'wb'))
    pickle.dump(classes, open(os.path.join(BASE_DIR, 'classes.pkl'),'wb'))

    # Prepare Training Data
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

    random.shuffle(training)
    training = np.array(training, dtype=object)

    train_x = list(training[:, 0])
    train_y = list(training[:, 1])

    print("Building Model...")
    # Create model - 3 layers. First layer 128 neurons, second layer 64 neurons and 3rd output layer contains number of neurons
    # equal to number of intents to predict output intent with softmax
    model = Sequential()
    model.add(Dense(128, input_shape=(len(train_x[0]),), activation='relu'))
    model.add(Dropout(0.5))
    model.add(Dense(64, activation='relu'))
    model.add(Dropout(0.5))
    model.add(Dense(len(train_y[0]), activation='softmax'))

    # Compile model. Stochastic gradient descent with Nesterov accelerated gradient gives good results for this model
    sgd = SGD(learning_rate=0.01, decay=1e-6, momentum=0.9, nesterov=True)
    model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])

    # fitting and saving the model 
    print("Training Model...")
    hist = model.fit(np.array(train_x), np.array(train_y), epochs=200, batch_size=5, verbose=1)
    
    model.save(os.path.join(BASE_DIR, 'chatbot_model.h5'))
    print("Model created and saved to chatbot_model.h5")

if __name__ == "__main__":
    train_model()
