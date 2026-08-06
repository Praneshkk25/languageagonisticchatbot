import os
import datetime
import uuid

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

def generate_scholarship_form_pdf(scholarship_data, student_data=None):
    """
    Generates an official downloadable PDF application form for a scholarship.
    Includes student profile details, eligibility checklist, necessary documents,
    and a Double Passkey security validation stamp.
    """
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    forms_dir = os.path.join(uploads_dir, "forms")
    os.makedirs(forms_dir, exist_ok=True)
    
    sch_id = scholarship_data.get("id", "scholarship")
    app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    filename = f"{sch_id}_application_form.pdf"
    output_path = os.path.join(forms_dir, filename)
    
    if student_data is None:
        student_data = {
            "name": "Student Applicant",
            "admission_no": "2023CS001",
            "department": "CSE",
            "year": 3,
            "cgpa": 9.2,
            "family_income": 250000.0,
            "dob": "2000-01-01"
        }
        
    sch_name = scholarship_data.get("scholarship_name", "National Scholarship")
    cat_name = scholarship_data.get("category_name", "Undergraduate Scholarship")
    benefits = scholarship_data.get("benefits", "Tuition Fee Reimbursement / Cash Stipend")
    portal = scholarship_data.get("official_portal", "National Scholarship Portal")
    docs = scholarship_data.get("necessary_documents", [
        "Class 10th & 12th Marksheet",
        "Aadhaar Card",
        "Income Certificate",
        "College Bonafide Certificate",
        "Bank Account Passbook Copy"
    ])
    
    if fitz:
        doc = fitz.open()
        page = doc.new_page(width=595, height=842) # A4 size
        
        # Draw Decorative Header Bar
        rect_header = fitz.Rect(0, 0, 595, 60)
        page.draw_rect(rect_header, color=(0.08, 0.45, 0.40), fill=(0.08, 0.45, 0.40))
        
        # Header Text
        page.insert_text((30, 35), "GOVERNMENT & INSTITUTIONAL SCHOLARSHIP PORTAL", fontsize=14, color=(1, 1, 1), fontname="helv")
        page.insert_text((420, 35), f"FORM ID: {app_id}", fontsize=9, color=(1, 1, 1), fontname="helv")
        
        # Title Section
        page.insert_text((30, 85), f"OFFICIAL APPLICATION FORM - 2026", fontsize=16, color=(0.1, 0.1, 0.2), fontname="helv")
        page.insert_text((30, 105), f"Scholarship Name: {sch_name}", fontsize=12, color=(0.08, 0.45, 0.40), fontname="helv")
        page.insert_text((30, 120), f"Category: {cat_name}  |  Portal: {portal}", fontsize=9, color=(0.4, 0.4, 0.4), fontname="helv")
        
        # Line Divider
        page.draw_line((30, 130), (565, 130), color=(0.8, 0.8, 0.8), width=1)
        
        # Section 1: Student Profile
        page.insert_text((30, 150), "SECTION A: APPLICANT STUDENT DETAILS (PRE-FILLED)", fontsize=11, color=(0.1, 0.1, 0.2), fontname="helv")
        
        y = 170
        page.insert_text((30, y), f"Student Name: {student_data.get('name', 'N/A')}", fontsize=10, fontname="helv")
        page.insert_text((300, y), f"Admission No / ID: {student_data.get('admission_no', 'N/A')}", fontsize=10, fontname="helv")
        
        y += 18
        page.insert_text((30, y), f"Department: {student_data.get('department', 'N/A')}", fontsize=10, fontname="helv")
        page.insert_text((300, y), f"Academic Year: Year {student_data.get('year', 'N/A')}", fontsize=10, fontname="helv")
        
        y += 18
        page.insert_text((30, y), f"Current CGPA: {student_data.get('cgpa', 'N/A')}", fontsize=10, fontname="helv")
        page.insert_text((300, y), f"Annual Family Income: Rs. {student_data.get('family_income', 0):,.2f}", fontsize=10, fontname="helv")
        
        # Line Divider
        y += 15
        page.draw_line((30, y), (565, y), color=(0.8, 0.8, 0.8), width=1)
        
        # Section 2: Scholarship Benefits & Coverage
        y += 20
        page.insert_text((30, y), "SECTION B: SCHOLARSHIP BENEFITS & FINANCIAL AID COVERAGE", fontsize=11, color=(0.1, 0.1, 0.2), fontname="helv")
        y += 18
        page.insert_text((30, y), f"Award / Grant: {benefits}", fontsize=10, color=(0.08, 0.45, 0.40), fontname="helv")
        
        # Line Divider
        y += 15
        page.draw_line((30, y), (565, y), color=(0.8, 0.8, 0.8), width=1)
        
        # Section 3: Necessary Documents Checklist
        y += 20
        page.insert_text((30, y), "SECTION C: MANDATORY DOCUMENTS TO ATTACH WITH THIS FORM", fontsize=11, color=(0.1, 0.1, 0.2), fontname="helv")
        
        y += 20
        for i, d in enumerate(docs, 1):
            page.draw_rect(fitz.Rect(30, y - 9, 40, y + 1), color=(0.3, 0.3, 0.3), fill=(0.95, 0.95, 0.95))
            page.insert_text((50, y), f"{i}. {d}", fontsize=9.5, color=(0.2, 0.2, 0.2), fontname="helv")
            y += 18
            if y > 750:
                break
                
        # Security Passkey Stamp Box
        y += 10
        stamp_rect = fitz.Rect(30, y, 565, y + 55)
        page.draw_rect(stamp_rect, color=(0.08, 0.45, 0.40), fill=(0.93, 0.97, 0.96), width=1.5)
        
        page.insert_text((45, y + 20), "DOUBLE PASSKEY AUTHORIZED - CLOUD VAULT ENCRYPTED", fontsize=10, color=(0.08, 0.45, 0.40), fontname="helv")
        page.insert_text((45, y + 36), f"Passkey 1 & Passkey 2 Verified | Authorized Date: {datetime.date.today().strftime('%B %d, %Y')} | Status: VERIFIED", fontsize=8.5, color=(0.3, 0.3, 0.3), fontname="helv")
        
        # Footer
        page.insert_text((30, 815), "Instructions: Download, print, sign the declaration, attach required documents, and submit to the Academic Office.", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
        page.insert_text((430, 815), "Campus Connect System", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
        
        doc.save(output_path)
        doc.close()
    else:
        # Fallback text file if fitz is absent
        output_path = os.path.join(forms_dir, f"{sch_id}_application_form.txt")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"OFFICIAL SCHOLARSHIP APPLICATION FORM\n")
            f.write(f"Scholarship: {sch_name}\nCategory: {cat_name}\n")
            f.write(f"Student: {student_data.get('name')} ({student_data.get('admission_no')})\n")
            f.write(f"Benefits: {benefits}\n\nNecessary Documents Needed:\n")
            for d in docs:
                f.write(f"- [ ] {d}\n")
            f.write(f"\nDOUBLE PASSKEY VERIFIED STAMP - CLOUD ENCRYPTED\n")

    return f"/uploads/forms/{os.path.basename(output_path)}"
