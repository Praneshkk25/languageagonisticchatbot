import os
import logging
import json
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
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
VECTOR_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "college_faiss_index")
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_knowledge")

DEPT_MAP = {
    "CE": "CIVIL",
    "CS": "CSE",
    "EC": "ECE",
    "EE": "EEE",
    "ME": "MECH",
    "IT": "IT",
    "FT": "FT",
    "MC": "MCT",
    "BM": "BME",
    "ADS": "ADS",
    "AML": "AML",
    "CSD": "CSD",
    "EFE": "EFE",
    "EXE": "EXE",
    "SCE": "SCE",
    "CBE": "CBE",
    "SFE": "SFE",
    "EVE": "EVE"
}
SEQ_CORE = ['CIVIL', 'CSE', 'ECE', 'EEE', 'MECH', 'IT', 'FT', 'MCT', 'BME']
SEQ_SPEC = ['ADS', 'AML', 'CSD', 'EFE', 'EXE', 'SCE', 'CBE', 'SFE', 'EVE']

def is_date(text):
    return bool(re.search(r'\d{2}\.\d{2}\.\d{2,4}', text))

def is_time(text):
    text_lower = text.lower()
    return "am" in text_lower or "pm" in text_lower

def get_dept_from_codes(text):
    cleaned = text.upper().replace('|', 'I').replace('1T', 'IT').replace('C5', 'CS')
    matches = re.findall(r'[U0O]\d{2}([A-Z]{2,4})\d+', cleaned)
    for m in matches:
        if m in DEPT_MAP:
            return DEPT_MAP[m]
    return None

def split_elective_courses(text):
    pattern = r'\b([U0O]\d{2}[A-Z]+\d+[\w-]*)\b'
    matches = list(re.finditer(pattern, text, re.IGNORECASE))
    courses = []
    for idx, match in enumerate(matches):
        start = match.start()
        end = matches[idx+1].start() if idx + 1 < len(matches) else len(text)
        course_segment = text[start:end].strip()
        if len(course_segment) > 5:
            courses.append(course_segment)
    if not courses:
        return [text]
    return courses

class LearningSystem:
    def __init__(self):
        current_model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        self.embeddings = HuggingFaceEmbeddings(model_name=current_model_name)
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
        self.ocr_reader = None # Lazy load EasyOCR
        self.knowledge_base = [] # To track learned files for status
        
        # Check if the FAISS index matches our current embedding model
        # Rebuild if model changed
        model_marker = os.path.join(VECTOR_DB_PATH, "embedding_model.txt")
        rebuild = False
        if os.path.exists(VECTOR_DB_PATH):
            if os.path.exists(model_marker):
                try:
                    with open(model_marker, "r", encoding="utf-8") as f:
                        saved_model = f.read().strip()
                    if saved_model != current_model_name:
                        logger.warning(f"Embedding model changed from {saved_model} to {current_model_name}. Rebuilding index...")
                        rebuild = True
                except Exception as e:
                    logger.error(f"Failed to read model marker: {e}")
                    rebuild = True
            else:
                logger.warning("No embedding model marker found in index. Rebuilding index...")
                rebuild = True

        if rebuild:
            import shutil
            try:
                shutil.rmtree(VECTOR_DB_PATH)
                logger.info("Cleared old vector database index due to embedding model mismatch.")
            except Exception as e:
                logger.error(f"Failed to clear old vector index: {e}")
                
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
                docs = loader.load()
                has_text = any(doc.page_content.strip() for doc in docs)
                if not has_text:
                    logger.info(f"No text extracted via PyPDFLoader from {file_path}. Falling back to OCR...")
                    import fitz
                    ocr_docs = []
                    doc = fitz.open(file_path)
                    reader = self.get_ocr_reader()
                    for page_idx, page in enumerate(doc):
                        logger.info(f"Performing OCR on PDF page {page_idx+1}/{len(doc)}...")
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        results = reader.readtext(img_bytes, detail=1)
                        
                        blocks = []
                        for bbox, text, conf in results:
                            (x0, y0), (x1, _) , (_, y1), _ = bbox
                            blocks.append((x0, y0, x1, y1, text.strip()))
                            
                        # Extract Page Title (y < 160)
                        title_parts = [b for b in blocks if b[3] < 160]
                        title_parts.sort(key=lambda x: (x[1], x[0]))
                        title_text = " | ".join([p[4] for p in title_parts])
                        
                        # Check if this page is a timetable
                        is_timetable = False
                        keywords = ["SCHEDULE", "TIMETABLE", "CIE", "TEST SCHEDULE", "EVALUATION TEST", "EXAMINATIONS"]
                        has_keyword = any(k in title_text.upper() for k in keywords) or any(any(k in b[4].upper() for k in keywords) for b in blocks[:15])
                        
                        date_count = sum(1 for b in blocks if b[3] < 280 and is_date(b[4]))
                        dept_count = 0
                        for b in blocks:
                            if b[0] < 100 and b[1] > 250:
                                text_cleaned = b[4].strip().upper()
                                if text_cleaned in SEQ_CORE or text_cleaned in SEQ_SPEC:
                                    dept_count += 1
                                    
                        is_timetable = has_keyword and (date_count >= 2 or dept_count >= 2)
                        
                        if is_timetable:
                            logger.info(f"Page {page_idx+1} recognized as timetable grid. Parsing dynamically...")
                            is_open_elective_page = "OPEN ELECTIVE" in title_text.upper() or any("OPEN ELECTIVE" in b[4].upper() for b in blocks)
                            
                            std_blocks = []
                            oe_blocks = []
                            oe_y_start = pix.height
                            
                            if is_open_elective_page:
                                for b in blocks:
                                    if "OPEN ELECTIVE" in b[4].upper() and b[1] > 400:
                                        oe_y_start = b[1] - 10
                                        break
                                std_blocks = [b for b in blocks if b[3] <= oe_y_start]
                                oe_blocks = [b for b in blocks if b[1] > oe_y_start]
                            else:
                                std_blocks = blocks
                                
                            # --- PROCESS STANDARD TABLE ---
                            date_headers = [b for b in std_blocks if b[3] < 280 and is_date(b[4])]
                            time_headers = [b for b in std_blocks if b[3] < 280 and is_time(b[4]) and "office" not in b[4].lower()]
                            
                            column_mappings = []
                            if date_headers or time_headers:
                                # Cluster times to columns
                                time_centers = [(t[0] + t[2]) / 2 for t in time_headers]
                                time_centers.sort()
                                columns = []
                                for tc in time_centers:
                                    if not columns:
                                        columns.append([tc])
                                    else:
                                        if tc - sum(columns[-1])/len(columns[-1]) < 60:
                                            columns[-1].append(tc)
                                        else:
                                            columns.append([tc])
                                column_centers = [sum(c)/len(c) for c in columns]
                                column_centers.sort()
                                
                                for col_idx, col_center in enumerate(column_centers):
                                    matching_times = [t[4] for t in time_headers if abs((t[0]+t[2])/2 - col_center) < 60]
                                    time_str = " ".join(matching_times)
                                    
                                    closest_date = "Unknown Date"
                                    min_dist = float('inf')
                                    for d in date_headers:
                                        d_center = (d[0] + d[2]) / 2
                                        dist = abs(d_center - col_center)
                                        if d[0] <= col_center <= d[2]:
                                            closest_date = d[4]
                                            break
                                        if dist < min_dist:
                                            min_dist = dist
                                            closest_date = d[4]
                                    column_mappings.append({
                                        "index": col_idx,
                                        "center": col_center,
                                        "date": closest_date,
                                        "time": time_str
                                    })
                                    
                            # Detect department labels
                            dept_blocks = []
                            for b in std_blocks:
                                if b[0] < 100 and b[1] > 250:
                                    text_cleaned = b[4].strip()
                                    if len(text_cleaned) > 1 and not is_date(text_cleaned) and not is_time(text_cleaned) and text_cleaned.upper() not in ["DATE", "TIME", "S.NO", "S.No", "S.NO.", "OPEN ELECTIVE", "CONTROLLER"]:
                                        dept_blocks.append(b)
                                        
                            dept_blocks.sort(key=lambda x: x[1])
                            unique_depts = []
                            for d in dept_blocks:
                                if not unique_depts:
                                    unique_depts.append(d)
                                else:
                                    if d[1] - unique_depts[-1][1] < 20:
                                        continue
                                    unique_depts.append(d)
                                    
                            core_matches = sum(1 for d in unique_depts if d[4].upper() in SEQ_CORE)
                            spec_matches = sum(1 for d in unique_depts if d[4].upper() in SEQ_SPEC)
                            target_seq = SEQ_CORE if core_matches >= spec_matches else SEQ_SPEC
                            
                            first_seq_idx = len(target_seq)
                            last_seq_idx = -1
                            for idx, expected in enumerate(target_seq):
                                if any(d[4].upper() == expected for d in unique_depts):
                                    first_seq_idx = min(first_seq_idx, idx)
                                    last_seq_idx = max(last_seq_idx, idx)
                                    
                            aligned_depts = []
                            if last_seq_idx >= first_seq_idx:
                                subset_seq = target_seq[first_seq_idx:last_seq_idx + 1]
                                det_idx = 0
                                
                                while det_idx < len(unique_depts) and unique_depts[det_idx][4].upper() != subset_seq[0]:
                                    det_idx += 1
                                    
                                for expected_name in subset_seq:
                                    found = False
                                    for i in range(det_idx, min(det_idx + 2, len(unique_depts))):
                                        if unique_depts[i][4].upper() == expected_name:
                                            aligned_depts.append((expected_name, unique_depts[i][1]))
                                            det_idx = i + 1
                                            found = True
                                            break
                                    if not found:
                                        if aligned_depts:
                                            last_y = aligned_depts[-1][1]
                                            next_y = unique_depts[det_idx][1] if det_idx < len(unique_depts) else last_y + 90
                                            num_missing = 1
                                            for j in range(subset_seq.index(expected_name) + 1, len(subset_seq)):
                                                nxt = subset_seq[j]
                                                if det_idx < len(unique_depts) and unique_depts[det_idx][4].upper() == nxt:
                                                    num_missing = j - subset_seq.index(expected_name)
                                                    break
                                            phantom_y = last_y + (next_y - last_y) / (num_missing + 1)
                                            aligned_depts.append((expected_name, phantom_y))
                                        else:
                                            next_y = unique_depts[det_idx][1] if det_idx < len(unique_depts) else 310
                                            aligned_depts.append((expected_name, next_y - 90))
                                            
                            # Create row boundary spans
                            row_spans = []
                            for i, (name, y_coord) in enumerate(aligned_depts):
                                y_top = 280 if i == 0 else (aligned_depts[i-1][1] + y_coord) / 2
                                y_bottom = oe_y_start if i == len(aligned_depts) - 1 else (y_coord + aligned_depts[i+1][1]) / 2
                                row_spans.append((name, y_coord, y_top, y_bottom))
                                
                            # Group and parse cells
                            page_sentences = []
                            for dept_name, y_coord, y_top, y_bottom in row_spans:
                                row_blocks = [b for b in std_blocks if b[0] >= 100 and y_top <= (b[1] + b[3])/2 <= y_bottom]
                                
                                col_cells = {col['index']: [] for col in column_mappings}
                                for rb in row_blocks:
                                    cx = (rb[0] + rb[2]) / 2
                                    closest_col = min(column_mappings, key=lambda c: abs(c['center'] - cx))
                                    col_cells[closest_col['index']].append(rb)
                                    
                                for col in column_mappings:
                                    cell_blocks = col_cells[col['index']]
                                    cell_blocks.sort(key=lambda x: x[1])
                                    cell_text = " ".join([b[4] for b in cell_blocks]).strip()
                                    if cell_text and cell_text != "-" and len(cell_text) > 2:
                                        sentence = f"Exam Details: In {title_text}, Department {dept_name} has exam for course: {cell_text} scheduled on Date {col['date']} at Time {col['time']}."
                                        page_sentences.append(sentence)
                                        
                            # Add to ocr_docs
                            if page_sentences:
                                combined_text = "\n".join(page_sentences)
                                ocr_docs.append(Document(page_content=combined_text, metadata={"source": os.path.basename(file_path), "page": page_idx+1}))
                                
                            # --- PROCESS OPEN ELECTIVE TABLE ---
                            if is_open_elective_page and oe_blocks:
                                oe_date = "31.07.2026"
                                oe_time = "9.15am To 10.45am"
                                for b in oe_blocks:
                                    if b[3] <= oe_y_start + 150:
                                        if is_date(b[4]):
                                            d_match = re.search(r'\d{2}\.\d{2}\.\d{2,4}', b[4])
                                            if d_match:
                                                oe_date = d_match.group(0)
                                        elif is_time(b[4]) and "time" in b[4].lower():
                                            t_match = re.search(r'\d{1,2}\.\d{2}\s*(?:am|pm)\s*To\s*\d{1,2}\.\d{2}\s*(?:am|pm)', b[4], re.IGNORECASE)
                                            if t_match:
                                                oe_time = t_match.group(0)
                                                
                                oe_course_blocks = []
                                for b in oe_blocks:
                                    if b[1] > oe_y_start + 40 and b[3] < pix.height - 40:
                                        if b[4].upper() not in ["S.NO", "TIME", "OPEN ELECTIVE", "CONTROLLER OF EXAMINATIONS"]:
                                            oe_course_blocks.append(b)
                                            
                                oe_course_blocks.sort(key=lambda b: (b[1] + b[3])/2)
                                oe_rows = []
                                for b in oe_course_blocks:
                                    cy = (b[1] + b[3]) / 2
                                    assigned = False
                                    for r in oe_rows:
                                        avg_cy = sum((x[1] + x[3])/2 for x in r) / len(r)
                                        if abs(cy - avg_cy) < 20:
                                            r.append(b)
                                            assigned = True
                                            break
                                    if not assigned:
                                        oe_rows.append([b])
                                        
                                oe_sentences = []
                                for row_idx, r in enumerate(oe_rows):
                                    r.sort(key=lambda x: x[0])
                                    row_text = " ".join([b[4] for b in r])
                                    
                                    if any(k in row_text.upper() for k in ["DATE:", "TIME:", "S.NO", "S.No", "SCHEDULE", "CONTROLLER"]):
                                        continue
                                        
                                    sno_match = re.match(r'^(\d+)\s+(.*)', row_text)
                                    if sno_match:
                                        sno = sno_match.group(1)
                                        content = sno_match.group(2)
                                    else:
                                        sno = str(row_idx + 1)
                                        content = row_text
                                        
                                    courses = split_elective_courses(content)
                                    for course in courses:
                                        sentence = f"Open Elective Exam Details: In {title_text}, Open Elective course: {course} is scheduled on Date {oe_date} at Time {oe_time}."
                                        oe_sentences.append(sentence)
                                        
                                if oe_sentences:
                                    combined_text = "\n".join(oe_sentences)
                                    ocr_docs.append(Document(page_content=combined_text, metadata={"source": os.path.basename(file_path), "page": page_idx+1, "section": "open_elective"}))
                                    
                        else:
                            logger.info(f"Page {page_idx+1} is not a timetable. Using standard OCR...")
                            result = reader.readtext(img_bytes, detail=0)
                            text = " ".join(result)
                            ocr_docs.append(Document(page_content=text, metadata={"source": os.path.basename(file_path), "page": page_idx+1}))
                    doc.close()
                    return ocr_docs
                return docs
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

    def extract_and_store_scholarship(self, doc_text, filename):
        scholarship_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()
        if "scholarship" not in scholarship_name.lower():
            scholarship_name += " Scholarship"

        # Defaults
        min_gpa = None
        max_income = None
        eligible_departments = []
        eligible_years = []

        # Try to use LLM first
        llm_success = False
        try:
            import qwen_logic
            bot = qwen_logic.get_bot()
            prompt = (
                "<|im_start|>system\n"
                "You are an information extraction assistant. Extract scholarship eligibility criteria from the text. "
                "Output ONLY a valid JSON object matching this schema. Do not write any markdown code blocks, text explanations, or extra tokens. Just raw JSON.\n"
                "Schema:\n"
                "{\n"
                '  "scholarship_name": "string",\n'
                '  "min_gpa": float or null,\n'
                '  "max_income": float or null,\n'
                '  "eligible_departments": ["string"] or [],\n'
                '  "eligible_years": [int] or []\n'
                "}\n"
                "<|im_end|>\n"
                f"<|im_start|>user\nText: {doc_text[:2000]}\n<|im_end|>\n<|im_start|>assistant\n"
            )
            inputs = bot.tokenizer(prompt, return_tensors="pt").to(bot.model.device)
            import torch
            with torch.no_grad():
                outputs = bot.model.generate(**inputs, max_new_tokens=256, temperature=0.1)
            response = bot.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()
            
            if response.startswith("```"):
                response = re.sub(r"^```(?:json)?\n", "", response)
                response = re.sub(r"\n```$", "", response)
            
            parsed = json.loads(response.strip())
            if parsed.get("scholarship_name"):
                scholarship_name = parsed["scholarship_name"]
            min_gpa = parsed.get("min_gpa")
            max_income = parsed.get("max_income")
            eligible_departments = parsed.get("eligible_departments", [])
            eligible_years = parsed.get("eligible_years", [])
            llm_success = True
            logger.info(f"LLM successfully extracted scholarship criteria: {parsed}")
        except Exception as e:
            logger.warning(f"LLM extraction failed or timed out: {e}. Falling back to Regex parsing.")

        if not llm_success:
            # Regex Fallback
            gpa_match = re.search(r'(?:gpa|cgpa)[^\d]*(\d\.\d)', doc_text, re.IGNORECASE)
            if gpa_match:
                min_gpa = float(gpa_match.group(1))

            income_match = re.search(r'(?:income|salary|lakhs?)[^\d]*([\d,]+)', doc_text, re.IGNORECASE)
            if income_match:
                clean_num = income_match.group(1).replace(",", "")
                try:
                    max_income = float(clean_num)
                except:
                    pass
            lakh_match = re.search(r'(\d+)\s*lakh', doc_text, re.IGNORECASE)
            if lakh_match:
                max_income = float(lakh_match.group(1)) * 100000.0

            for dept_code, dept_full in DEPT_MAP.items():
                if dept_code in doc_text.upper() or dept_full in doc_text.upper():
                    eligible_departments.append(dept_code)
            
            if re.search(r'\b(2nd|second|ii)\s*year', doc_text, re.IGNORECASE):
                eligible_years.append(2)
            if re.search(r'\b(3rd|third|iii)\s*year', doc_text, re.IGNORECASE):
                eligible_years.append(3)
            if re.search(r'\b(4th|fourth|iv)\s*year', doc_text, re.IGNORECASE):
                eligible_years.append(4)
            if re.search(r'\b(1st|first|i)\s*year', doc_text, re.IGNORECASE):
                eligible_years.append(1)

        from database import db
        scholarship_id = filename.lower().replace(".", "_").replace(" ", "_")
        criteria_data = {
            "id": scholarship_id,
            "scholarship_name": scholarship_name,
            "min_gpa": min_gpa,
            "max_income": max_income,
            "eligible_departments": [d.upper() for d in eligible_departments] if eligible_departments else None,
            "eligible_years": eligible_years if eligible_years else None,
            "source_file": filename
        }
        
        db.collection("scholarships").document(scholarship_id).set(criteria_data)
        logger.info(f"Stored scholarship criteria for {scholarship_id}: {criteria_data}")

    def learn_document(self, file_path, original_filename, content_type):
        docs = self.extract_docs(file_path, content_type)
        if not docs:
            return False, "Could not extract content."

        # If it is a scholarship document, let's extract and store structured criteria
        doc_text = " ".join([d.page_content for d in docs])
        is_scholarship = False
        if "scholarship" in original_filename.lower() or "eligibility" in original_filename.lower():
            is_scholarship = True
        elif any(k in doc_text.lower() for k in ["scholarship", "financial aid", "stipend", "eligibility criteria"]):
            is_scholarship = True

        if is_scholarship:
            try:
                self.extract_and_store_scholarship(doc_text, original_filename)
            except Exception as e:
                logger.error(f"Error extracting scholarship criteria: {e}")

        chunks = self.text_splitter.split_documents(docs)
        chunks = [c for c in chunks if c.page_content.strip()]
        if not chunks:
            return False, "Could not extract content."
        
        # Load existing or create new FAISS index
        if os.path.exists(VECTOR_DB_PATH):
            vector_db = FAISS.load_local(VECTOR_DB_PATH, self.embeddings, allow_dangerous_deserialization=True)
            vector_db.add_documents(chunks)
        else:
            vector_db = FAISS.from_documents(chunks, self.embeddings)
        
        vector_db.save_local(VECTOR_DB_PATH)
        
        # Write model marker
        model_marker = os.path.join(VECTOR_DB_PATH, "embedding_model.txt")
        try:
            with open(model_marker, "w", encoding="utf-8") as f:
                f.write("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        except Exception as e:
            logger.error(f"Failed to write model marker: {e}")
        
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
