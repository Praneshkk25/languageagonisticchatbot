import os
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig
)
from peft import PeftModel
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_community.vectorstores import FAISS
from langdetect import detect
import easyocr
from langchain_core.documents import Document
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
        self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
        
        # Quantization Config for low VRAM (4-bit)
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16
        )

        # Load Base Model
        self.base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True
        )
        logger.info(f"Model loaded on device: {self.base_model.device}")

        
        # Load Adapters if they exist
        if os.path.exists(LORA_PATH):
            self.model = PeftModel.from_pretrained(self.base_model, LORA_PATH)
            logger.info(f"Loaded fine-tuned local weights from {LORA_PATH}")
        else:
            self.model = self.base_model
            logger.warning(f"Fine-tuned weights not found at {LORA_PATH}. Using base model.")

        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.vector_db = None
        self.retriever = None
        self.refresh_retriever()

        
    def refresh_retriever(self):
        """Reloads the FAISS index from disk."""
        if os.path.exists(VECTOR_DB_PATH):
            logger.info(f"Loading FAISS index from {VECTOR_DB_PATH}")
            vdb = FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
            if vdb:
                self.vector_db = vdb
                self.retriever = vdb.as_retriever(search_kwargs={"k": 3})
            else:
                self.vector_db = None
                self.retriever = None
        else:
            logger.warning("RAG Vector DB not found.")
            self.vector_db = None
            self.retriever = None



    def check_safety_guardrails(self, query):
        harmful_keywords = ["hack grading", "steal identity", "illegal"]
        if any(word in query.lower() for word in harmful_keywords):
            return False, "I cannot assist with that request. Please contact the administration."
        return True, ""

    def process_query(self, query, language="en"):
        is_safe, refusal_msg = self.check_safety_guardrails(query)
        if not is_safe:
            return refusal_msg
            
        try:
            detected_lang = detect(query)
        except:
            detected_lang = language or "en"
            
        context = ""
        if self.retriever:
            try:
                retrieved_docs = self.retriever.invoke(query)
                context = "\n".join([doc.page_content for doc in retrieved_docs])
            except Exception as e:
                logger.error(f"RAG retrieval error: {e}")
            
        system_instructions = {
            "hi": "आप एक कॉलेज सहायक बॉट हैं। नीचे दी गई जानकारी का उपयोग करके उत्तर दें।",
            "en": "You are a helpful college assistant bot. Answer the question based on the context provided."
        }
        sys_prompt = system_instructions.get(detected_lang, system_instructions["en"])

        prompt = f"<|im_start|>system\n{sys_prompt}\nContext: {context}<|im_end|>\n<|im_start|>user\n{query}<|im_end|>\n<|im_start|>assistant\n"
        
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        outputs = self.model.generate(**inputs, max_new_tokens=256, temperature=0.2, repetition_penalty=1.1)
        response = self.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        
        return response.strip()

# Lazy initialization
bot = None

def get_bot():
    global bot
    if bot is None:
        bot = CollegeChatbot()
    return bot
