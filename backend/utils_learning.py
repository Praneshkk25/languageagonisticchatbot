import os
import logging
from langchain_community.document_loaders import (
    TextLoader, 
    PyPDFLoader, 
    Docx2txtLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
import easyocr

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
VECTOR_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "college_faiss_index")
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_knowledge")

class LearningSystem:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
        self.ocr_reader = None # Lazy load EasyOCR
        self.knowledge_base = [] # To track learned files for status
        self.load_metadata()

    def load_metadata(self):
        """Simple check to see what's already in the upload dir for status reporting."""
        if os.path.exists(UPLOAD_DIR):
            files = os.listdir(UPLOAD_DIR)
            for f in files:
                self.knowledge_base.append({'source': f})

    def get_ocr_reader(self):
        if self.ocr_reader is None:
            logger.info("Loading EasyOCR...")
            self.ocr_reader = easyocr.Reader(['en', 'hi'])
        return self.ocr_reader

    def load_image_with_ocr(self, file_path):
        reader = self.get_ocr_reader()
        result = reader.readtext(file_path, detail=0)
        text = " ".join(result)
        return [Document(page_content=text, metadata={"source": os.path.basename(file_path)})]

    def extract_docs(self, file_path, content_type):
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file_path)
                return loader.load()
            elif ext == ".docx":
                loader = Docx2txtLoader(file_path)
                return loader.load()
            elif ext in [".png", ".jpg", ".jpeg"]:
                return self.load_image_with_ocr(file_path)
            else:
                loader = TextLoader(file_path, encoding='utf-8')
                return loader.load()
        except Exception as e:
            logger.error(f"Error extracting from {file_path}: {e}")
            return []

    def learn_document(self, file_path, original_filename, content_type):
        docs = self.extract_docs(file_path, content_type)
        if not docs:
            return False, "Could not extract content."

        chunks = self.text_splitter.split_documents(docs)
        
        # Load existing or create new FAISS index
        if os.path.exists(VECTOR_DB_PATH):
            vector_db = FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
            vector_db.add_documents(chunks)
        else:
            vector_db = FAISS.from_documents(chunks, self.embeddings)
        
        vector_db.save_local(VECTOR_DB_PATH)
        
        # Track for status
        if not any(x['source'] == original_filename for x in self.knowledge_base):
            self.knowledge_base.append({'source': original_filename})
        
        # Refresh the global bot retriever if it exists
        try:
            import qwen_logic
            current_bot = qwen_logic.bot
            if current_bot:
                current_bot.refresh_retriever()
        except Exception as e:
            logger.warning(f"Could not refresh bot retriever: {e}")

        return True, f"Learned {len(chunks)} chunks from {original_filename}."

    def find_relevant_context(self, query):
        """Deprecated: The Qwen model handles retrieval itself via get_bot().retriever."""
        # This remains for compatibility if any other parts of the system call it
        if os.path.exists(VECTOR_DB_PATH):
            vector_db = FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
            results = vector_db.similarity_search(query, k=3)
            return [doc.page_content for doc in results]
        return []

learning_system = LearningSystem()
