import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from scholarships_data import SCHOLARSHIP_CATEGORIES, ALL_SCHOLARSHIPS
from form_generator import generate_scholarship_form_pdf

def test_direct():
    print("1. Checking 14 Scholarship Categories...")
    assert len(SCHOLARSHIP_CATEGORIES) == 14
    for cat in SCHOLARSHIP_CATEGORIES:
        sch_count = sum(1 for s in ALL_SCHOLARSHIPS if s.get("category_id") == cat["id"])
        print(f"   Category #{cat['id']}: {cat['name']} -> {sch_count} scholarships")
    
    print("\n2. Generating PDF Form with PyMuPDF...")
    pdf_url = generate_scholarship_form_pdf(ALL_SCHOLARSHIPS[0])
    print(f"   Generated Form URL: {pdf_url}")
    assert pdf_url.endswith(".pdf")
    
    print("\nDIRECT SCHOLARSHIP & PDF GENERATION TESTS PASSED!")

if __name__ == "__main__":
    test_direct()
