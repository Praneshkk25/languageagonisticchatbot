
import json
import numpy as np
import pickle
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, LSTM, Bidirectional, Embedding, Conv1D, GlobalMaxPooling1D, BatchNormalization
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
import random

def augment_sentence(sentence):
    # Simple augmentation: remove punctuation or swap some common words
    # In a real scenario, we'd use synonyms, but here we just want to expand the dataset
    return sentence.lower().replace("?", "").replace("!", "").strip()

def train_advanced_model():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Load & Augment Data
    print("--- Phase 1: Loading & Augmenting Data ---")
    with open(os.path.join(BASE_DIR, 'intents.json'), encoding='utf-8') as f:
        data = json.load(f)

    patterns = []
    tags = []
    classes = []

    for intent in data['intents']:
        for pattern in intent['patterns']:
            # Original
            patterns.append(pattern)
            tags.append(intent['tag'])
            # Augmentation 1: Clean
            patterns.append(augment_sentence(pattern))
            tags.append(intent['tag'])
            # Augmentation 2: Repeat (Oversampling)
            for _ in range(5):
                patterns.append(pattern)
                tags.append(intent['tag'])
                
        if intent['tag'] not in classes:
            classes.append(intent['tag'])

    classes = sorted(list(set(classes)))
    
    # 2. Tokenization
    MAX_WORDS = 1000 # Reduced for better generalization on small data
    MAX_LEN = 15
    
    tokenizer = Tokenizer(num_words=MAX_WORDS, oov_token="<OOV>")
    tokenizer.fit_on_texts(patterns)
    
    sequences = tokenizer.texts_to_sequences(patterns)
    padded_sequences = pad_sequences(sequences, maxlen=MAX_LEN, padding='post', truncating='post')
    
    tag_to_idx = {tag: i for i, tag in enumerate(classes)}
    labels = [tag_to_idx[t] for t in tags]
    labels = tf.keras.utils.to_categorical(labels, num_classes=len(classes))

    # 3. Train-Test Split (Smaller test size because data is scarce)
    X_train, X_val, y_train, y_val = train_test_split(padded_sequences, labels, test_size=0.15, random_state=42)

    # 4. Build Model (Slightly simplified to match data scale)
    print("--- Phase 2: Building CNN-RNN Hybrid ---")
    model = Sequential([
        Embedding(MAX_WORDS, 64, input_length=MAX_LEN),
        
        Conv1D(32, 3, activation='relu'),
        BatchNormalization(),
        
        Bidirectional(LSTM(32, return_sequences=True)),
        GlobalMaxPooling1D(),
        
        Dense(32, activation='relu'),
        Dropout(0.4), # Prevent overfitting
        
        Dense(len(classes), activation='softmax')
    ])

    # Lower learning rate for more stable learning
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    model.compile(loss='categorical_crossentropy', optimizer=optimizer, metrics=['accuracy'])

    # 5. Smart Training
    early_stop = EarlyStopping(monitor='val_accuracy', patience=20, restore_best_weights=True)

    print("--- Phase 3: Training ---")
    history = model.fit(
        X_train, y_train, 
        epochs=200, 
        batch_size=8,
        validation_data=(X_val, y_val),
        callbacks=[early_stop],
        verbose=1
    )

    # Save
    model.save(os.path.join(BASE_DIR, 'chatbot_model_advanced.h5'))
    with open(os.path.join(BASE_DIR, 'tokenizer.pkl'), 'wb') as f:
        pickle.dump(tokenizer, f)
    with open(os.path.join(BASE_DIR, 'classes_advanced.pkl'), 'wb') as f:
        pickle.dump(classes, f)

    print(f"\n✅ Final Validation Accuracy: {max(history.history['val_accuracy'])*100:.2f}%")

if __name__ == "__main__":
    train_advanced_model()
