import os
import pickle
import numpy as np
import fitz  # PyMuPDF
import docx
from sentence_transformers import SentenceTransformer
import pytesseract
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
KB_FILE = "knowledge_base.pkl"
MODEL_NAME = 'all-MiniLM-L6-v2'  # Small, fast, good quality

class LearningSystem:
    def __init__(self):
        self.model = None
        self.knowledge_base = []
        self.load_kb()
        
    def load_model(self):
        if self.model is None:
            logger.info("Loading SentenceTransformer model...")
            self.model = SentenceTransformer(MODEL_NAME)
            logger.info("Model loaded.")

    def load_kb(self):
        if os.path.exists(KB_FILE):
            try:
                with open(KB_FILE, 'rb') as f:
                    self.knowledge_base = pickle.load(f)
                logger.info(f"Loaded {len(self.knowledge_base)} documents from KB.")
            except Exception as e:
                logger.error(f"Error loading KB: {e}")
                self.knowledge_base = []
        else:
            self.knowledge_base = []

    def save_kb(self):
        with open(KB_FILE, 'wb') as f:
            pickle.dump(self.knowledge_base, f)
        logger.info("Knowledge Base saved.")

    def extract_text(self, file_path, content_type):
        text = ""
        try:
            if "pdf" in content_type or file_path.endswith(".pdf"):
                doc = fitz.open(file_path)
                for page in doc:
                    # Try getting text
                    page_text = page.get_text()
                    if not page_text.strip():
                        # If empty, might be scanned -> Use OCR (requires image conversion)
                        # For simplicity in this demo, we assume generic text PDF or simple scan
                        # If strict scanned PDF, we render to image and use Tesseract
                        pix = page.get_pixmap()
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        page_text = pytesseract.image_to_string(img)
                    text += page_text + "\n"
            elif "word" in content_type or file_path.endswith(".docx"):
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            elif "image" in content_type or file_path.endswith((".png", ".jpg", ".jpeg")):
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img)
            else:
                # Plain text
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
            
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""

    def learn_document(self, file_path, original_filename, content_type):
        self.load_model()
        text = self.extract_text(file_path, content_type)
        if not text:
            return False, "Could not extract text (empty or error)."

        # Chunking (Simple paragraph/line based or fixed size)
        # For simplicity: Chunk by paragraphs ~500 chars
        chunks = [c.strip() for c in text.split('\n\n') if c.strip()]
        if not chunks:
             chunks = [text] # Fallback

        # Embedding
        new_entries = []
        for chunk in chunks:
            if len(chunk) < 10: continue # Skip noise
            vector = self.model.encode(chunk)
            new_entries.append({
                'text': chunk,
                'vector': vector,
                'source': original_filename,
                'timestamp': os.path.getctime(file_path)
            })

        self.knowledge_base.extend(new_entries)
        self.save_kb()
        return True, f"Learned {len(new_entries)} chunks from {original_filename}."

    def find_relevant_context(self, query, top_k=3):
        self.load_model()
        if not self.knowledge_base:
            return []

        query_vector = self.model.encode(query)
        
        # Calculate Cosine Similarity
        # KB vectors shape: (N, D), Query shape: (D,)
        # Sim = dot(A, B) / (norm(A) * norm(B))
        # Assuming SentenceTransformers returns normalized vectors usually? 
        # Actually default output is not normalized. normalize_embeddings=True can be used.
        # We will use manual cosine.
        
        results = []
        for entry in self.knowledge_base:
            vec = entry['vector']
            score = np.dot(query_vector, vec) / (np.linalg.norm(query_vector) * np.linalg.norm(vec))
            results.append((score, entry))
        
        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1]['text'] for r in results[:top_k] if r[0] > 0.3] # Threshold 0.3

learning_system = LearningSystem()
