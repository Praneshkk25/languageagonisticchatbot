import os
import sys

# Ensure UTF-8 output encoding for console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS
from form_generator import generate_scholarship_form_pdf

def test_system():
    print(f"1. Checking Categories: {len(SCHOLARSHIP_CATEGORIES)} Categories loaded.")
    assert len(SCHOLARSHIP_CATEGORIES) == 14, "Expected 14 categories!"
    
    for c in SCHOLARSHIP_CATEGORIES:
        print(f"   [{c['id']}] {c['name']}")
        
    print(f"\n2. Checking Scholarships Data: {len(ALL_SCHOLARSHIPS)} Total Scholarships loaded.")
    
    # Test Form Generation
    print("\n3. Testing PDF Application Form Generator with PyMuPDF...")
    test_sch = ALL_SCHOLARSHIPS[0]
    pdf_path = generate_scholarship_form_pdf(test_sch)
    print(f"   Generated Form PDF Path: {pdf_path}")
    assert os.path.exists(os.path.join(os.path.dirname(__file__), pdf_path.lstrip("/"))), "PDF form file should exist!"
    
    print("\nAll 14 scholarship categories & PDF form system checks passed successfully!")

if __name__ == "__main__":
    test_system()
