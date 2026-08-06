# 14 Categories of Scholarships Data for Indian Undergraduate Students

SCHOLARSHIP_CATEGORIES = [
    {
        "id": 1,
        "name": "Central Government Scholarships",
        "code": "central_gov",
        "description": "National Scholarship Portal (NSP) schemes by Govt. of India for UG students.",
        "icon": "🏛️"
    },
    {
        "id": 2,
        "name": "Category-Based Scholarships",
        "code": "category_based",
        "description": "Specialized schemes for SC, ST, OBC, and Minority category students.",
        "icon": "👥"
    },
    {
        "id": 3,
        "name": "AICTE Scholarships",
        "code": "aicte",
        "description": "Technical, Engineering, and Pharmacy degree scholarships provided by AICTE.",
        "icon": "⚡"
    },
    {
        "id": 4,
        "name": "State Government Scholarships",
        "code": "state_gov",
        "description": "State-specific fee waivers and maintenance stipends across Indian states.",
        "icon": "🗺️"
    },
    {
        "id": 5,
        "name": "Merit-Based Scholarships",
        "code": "merit_based",
        "description": "Scholarships awarded purely on academic excellence and top rank performance.",
        "icon": "🏆"
    },
    {
        "id": 6,
        "name": "Need-Based Scholarships",
        "code": "need_based",
        "description": "Financial assistance for meritorious students from low-income families.",
        "icon": "🤝"
    },
    {
        "id": 7,
        "name": "Scholarships for Girls",
        "code": "girl_students",
        "description": "Dedicated funding initiatives promoting higher education for female students.",
        "icon": "👩‍🎓"
    },
    {
        "id": 8,
        "name": "Scholarships for Students with Disabilities (PwD)",
        "code": "pwd_students",
        "description": "Assistive allowances, device support, and tuition aid for PwD students.",
        "icon": "♿"
    },
    {
        "id": 9,
        "name": "Institutional Scholarships",
        "code": "institutional",
        "description": "Tuition waivers, sports quotas, and alumni funding from top institutes/universities.",
        "icon": "🎓"
    },
    {
        "id": 10,
        "name": "Sports Scholarships",
        "code": "sports",
        "description": "Financial aid and stipends for national, state, and university level athletes.",
        "icon": "🏅"
    },
    {
        "id": 11,
        "name": "Research and Innovation Scholarships",
        "code": "research_innovation",
        "description": "Grants for student innovators, patent holders, hackathons, and research projects.",
        "icon": "💡"
    },
    {
        "id": 12,
        "name": "International Scholarships for Indian UG Students",
        "code": "international",
        "description": "Study abroad grants and exchange programs in UK, USA, Germany, NZ.",
        "icon": "✈️"
    },
    {
        "id": 13,
        "name": "Corporate Scholarships",
        "code": "corporate",
        "description": "Philanthropic education scholarships from major corporations and foundations.",
        "icon": "🏢"
    },
    {
        "id": 14,
        "name": "Education Loan Interest Subsidy Schemes",
        "code": "loan_subsidy",
        "description": "Government interest subsidy support during moratorium period of education loans.",
        "icon": "💳"
    }
]

ALL_SCHOLARSHIPS = [
    # Category 1: Central Government
    {
        "id": "pm_usp_csss",
        "category_id": 1,
        "category_name": "Central Government Scholarships",
        "scholarship_name": "PM-USP Central Sector Scholarship Scheme (CSSS)",
        "min_gpa": 7.5,
        "max_income": 800000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "BSC", "BCOM", "BA", "LAW"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹12,000/year (1st-3rd year), ₹20,000/year in 4th year professional courses",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Top 20 percentile in Class XII board examination",
        "official_portal": "National Scholarship Portal (NSP - scholarships.gov.in)",
        "necessary_documents": [
            "Class 12th Board Marksheet & Passing Certificate",
            "Aadhaar Card of Student (Linked with Active Bank Account)",
            "Annual Family Income Certificate (Issued by Tehsildar/Competent Authority ≤ ₹8 Lakhs)",
            "College Bonafide Student Certificate & Verification Form",
            "Student Bank Account Passbook Copy (First page with IFSC & Account No.)",
            "Passport Size Photograph"
        ],
        "description": "Provides financial assistance to meritorious students from low-income families to meet day-to-day expenses while pursuing higher studies."
    },
    {
        "id": "inspire_she",
        "category_id": 1,
        "category_name": "Central Government Scholarships",
        "scholarship_name": "INSPIRE Scholarship (SHE)",
        "min_gpa": 8.0,
        "max_income": 1000000.0,
        "eligible_departments": ["BSC", "INT_MSC", "PHYSICS", "CHEMISTRY", "MATHS", "BIOLOGY"],
        "eligible_years": [1, 2, 3],
        "benefits": "₹80,000/year (₹60,000 cash stipend + ₹20,000 summer research project mentorship grant)",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Top 1% rank in Class XII Board or JEE Advanced / NEET top rankers",
        "official_portal": "INSPIRE DST Portal (online-inspire.gov.in)",
        "necessary_documents": [
            "Class 12th Marksheet showing Top 1% rank endorsement",
            "College Enrollment / Admission Verification Certificate",
            "Aadhaar Card",
            "Student Bank Account Details",
            "SBI Bank Account Passbook",
            "Category Certificate (if applicable)"
        ],
        "description": "Department of Science & Technology (DST) initiative to attract talented youth to study Natural and Basic Sciences at the undergraduate level."
    },
    {
        "id": "pm_scholarship_capf",
        "category_id": 1,
        "category_name": "Central Government Scholarships",
        "scholarship_name": "PM Scholarship Scheme (PMSS for Armed Forces & CAPF)",
        "min_gpa": 6.0,
        "max_income": 1200000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "MBBS", "BPHARM", "LAW"],
        "eligible_years": [1, 2, 3, 4, 5],
        "benefits": "₹2,500/month for Boys (₹30,000/yr), ₹3,000/month for Girls (₹36,000/yr)",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Minimum 60% marks in Class XII or Diploma",
        "official_portal": "National Scholarship Portal / KSB / WARB Portal",
        "necessary_documents": [
            "Discharge Certificate / Service Certificate of Parent in Armed Forces / CAPF",
            "Class 12th / Diploma Marksheet",
            "Aadhaar Card",
            "Bonafide Certificate from College Principal",
            "Bank Account Passbook Copy"
        ],
        "description": "Encourages higher technical and professional education for wards and widows of deceased/ex-service personnel of Armed Forces and CAPF."
    },

    # Category 2: Category-Based (SC / ST / OBC / Minority)
    {
        "id": "sc_post_matric",
        "category_id": 2,
        "category_name": "Category-Based Scholarships",
        "scholarship_name": "Post-Matric Scholarship for SC Students",
        "min_gpa": 5.0,
        "max_income": 250000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4, 5],
        "benefits": "100% Full Tuition Fee Reimbursement + Monthly Maintenance Allowance + Book Grant",
        "caste_category": "SC",
        "gender": "All",
        "academic_criteria": "Passed Class 12th and admitted into recognized UG course",
        "official_portal": "National Scholarship Portal & State Social Welfare Portals",
        "necessary_documents": [
            "SC Community / Caste Certificate issued by Revenue Authority",
            "Income Certificate (Annual family income ≤ ₹2.5 Lakhs)",
            "Class 10th and 12th Marksheets",
            "Fee Receipt & Bonafide Certificate of Current Academic Year",
            "Aadhaar Card linked to Bank Account (Aadhaar Seeding verification)",
            "Hostel Stay Certificate (if residing in college hostel)"
        ],
        "description": "Centrally sponsored scheme enabling Scheduled Caste students to complete post-secondary and undergraduate education without financial hardship."
    },
    {
        "id": "st_top_class",
        "category_id": 2,
        "category_name": "Category-Based Scholarships",
        "scholarship_name": "Top Class Education Scheme for ST Students",
        "min_gpa": 6.0,
        "max_income": 600000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "Full tuition fee up to ₹2.0 Lakhs/yr + Living expense ₹3,000/mo + Books ₹5,000/yr + Computer allowance ₹45,000",
        "caste_category": "ST",
        "gender": "All",
        "academic_criteria": "Admission into notified premier institutes (IITs, NITs, IIMs, NIFTs, etc.)",
        "official_portal": "Ministry of Tribal Affairs / NSP",
        "necessary_documents": [
            "ST Tribe Certificate",
            "Income Certificate (≤ ₹6 Lakhs)",
            "JEE Main / Entrance Exam Rank Card",
            "College Admission Letter & Fee Structure Breakdown",
            "Aadhaar Card & Bank Passbook Copy"
        ],
        "description": "Provides full financial support to talented ST students pursuing studies in top recognized institutes across India."
    },
    {
        "id": "pm_yasasvi_obc",
        "category_id": 2,
        "category_name": "Category-Based Scholarships",
        "scholarship_name": "PM-YASASVI Scholarship for OBC/EBC/DNT Students",
        "min_gpa": 6.0,
        "max_income": 250000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "Tuition Fee Reimbursement + Academic Allowance up to ₹1,25,000/year",
        "caste_category": "OBC/EBC/DNT",
        "gender": "All",
        "academic_criteria": "Passing YASASVI Entrance Test or Top ranking in Class 12th",
        "official_portal": "NTA YASASVI Portal / NSP",
        "necessary_documents": [
            "OBC / EBC / DNT Category Certificate",
            "Income Certificate (≤ ₹2.5 Lakhs)",
            "Class 12th Marksheet",
            "YASASVI Scorecard / Entrance Rank Proof",
            "Aadhaar Card and Student Bank Account Details"
        ],
        "description": "Scheme for Vibrant India for Awarding Scholarships for Knowledge to OBC and Other Categories."
    },
    {
        "id": "minority_mcm",
        "category_id": 2,
        "category_name": "Category-Based Scholarships",
        "scholarship_name": "Merit-cum-Means Scholarship for Minorities",
        "min_gpa": 6.5,
        "max_income": 250000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "MBBS", "BPHARM"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "Course Fee Reimbursement up to ₹20,000/year + Maintenance Allowance ₹1,000/month",
        "caste_category": "Minority (Muslim, Christian, Sikh, Buddhist, Jain, Parsi)",
        "gender": "All",
        "academic_criteria": "Minimum 50% marks in Class 12th / Previous Exam",
        "official_portal": "National Scholarship Portal (NSP)",
        "necessary_documents": [
            "Self-Declaration of Minority Community Status",
            "Income Certificate (≤ ₹2.5 Lakhs)",
            "Class 12th / Last Qualifying Exam Marksheet",
            "Bonafide Certificate & Paid Fee Receipt",
            "Aadhaar Card & Bank Passbook Copy"
        ],
        "description": "Provides financial aid to poor and meritorious students belonging to minority communities to pursue professional and technical UG courses."
    },

    # Category 3: AICTE Scholarships
    {
        "id": "aicte_pragati",
        "category_id": 3,
        "category_name": "AICTE Scholarships",
        "scholarship_name": "AICTE Pragati Scholarship for Girl Students",
        "min_gpa": 6.0,
        "max_income": 800000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "BPHARM"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹50,000/year (for tuition fee, books, equipment, laptop, competitive exam fees)",
        "caste_category": "All",
        "gender": "Female",
        "academic_criteria": "Admitted to 1st year Degree/Diploma course or 2nd year via Lateral Entry in AICTE approved institute",
        "official_portal": "AICTE Portal / National Scholarship Portal",
        "necessary_documents": [
            "Class 10th & 12th Marksheet",
            "Family Income Certificate (≤ ₹8 Lakhs)",
            "AICTE College Admission Allotment Letter",
            "Tuition Fee Paid Receipt",
            "Aadhaar Card & Bank Account Passbook",
            "Parents' Single Girl Child Affidavit (if applicable)"
        ],
        "description": "Empowers female students pursuing technical education by providing financial assistance up to 10,000 girl engineers every year."
    },
    {
        "id": "aicte_saksham",
        "category_id": 3,
        "category_name": "AICTE Scholarships",
        "scholarship_name": "AICTE Saksham Scholarship for Differently Abled Students",
        "min_gpa": 5.0,
        "max_income": 800000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "BPHARM"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹50,000/year for tuition, books, assistive devices, and laptop",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Specially-abled students having disability not less than 40%",
        "official_portal": "AICTE Portal / NSP",
        "necessary_documents": [
            "Disability Certificate issued by Competent Medical Authority (≥ 40% Disability)",
            "Class 10th & 12th Marksheets",
            "Family Income Certificate (≤ ₹8 Lakhs)",
            "AICTE College Admission Letter",
            "Aadhaar Card and Student Bank Account Details"
        ],
        "description": "Encourages specially-abled students to pursue technical education without financial hindrances."
    },
    {
        "id": "aicte_swanath",
        "category_id": 3,
        "category_name": "AICTE Scholarships",
        "scholarship_name": "AICTE Swanath Scholarship Scheme",
        "min_gpa": 5.0,
        "max_income": 800000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "BPHARM"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹50,000/year lump sum grant per annum",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Orphans, Wards of Armed Forces/Paramilitary martyrs, or children of parents who died due to COVID-19",
        "official_portal": "AICTE Portal / NSP",
        "necessary_documents": [
            "Death Certificate of Parents (COVID-19 death proof or Orphanage Cert / Martyr Cert)",
            "Class 10th and 12th Marksheet",
            "Income Certificate (≤ ₹8 Lakhs)",
            "AICTE Approved Institute Bonafide Certificate",
            "Aadhaar Card & Bank Passbook"
        ],
        "description": "Financial support to orphans, wards of martyred soldiers, and COVID-19 affected students to pursue technical degrees."
    },

    # Category 4: State Government Scholarships
    {
        "id": "tn_first_grad",
        "category_id": 4,
        "category_name": "State Government Scholarships",
        "scholarship_name": "Tamil Nadu First Graduate & BC/MBC/DNC Scholarship",
        "min_gpa": 6.0,
        "max_income": 250000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹20,000 - ₹50,000/year Tuition Fee Waiver for First Graduates",
        "caste_category": "BC / MBC / DNC / First Graduate",
        "gender": "All",
        "academic_criteria": "First person in family pursuing a graduation degree in Tamil Nadu",
        "official_portal": "Tamil Nadu e-District Portal / TN Scholarship Portal",
        "necessary_documents": [
            "First Graduate Certificate signed by Tahsildar",
            "Joint Declaration by Parents and Candidate",
            "Community Certificate (BC/MBC/DNC)",
            "Class 10th & 12th Marksheet",
            "Income Certificate (≤ ₹2.5 Lakhs)",
            "Aadhaar Card & Passbook Copy"
        ],
        "description": "Waives tuition fees for first-generation college graduates admitted via single-window counseling in Tamil Nadu."
    },
    {
        "id": "maha_dbt",
        "category_id": 4,
        "category_name": "State Government Scholarships",
        "scholarship_name": "Maharashtra MahaDBT Rajarshi Shahu Maharaj Scholarship",
        "min_gpa": 6.0,
        "max_income": 800000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "50% to 100% Tuition Fee & Exam Fee Reimbursement",
        "caste_category": "Open / EWS / SEBC / OBC",
        "gender": "All",
        "academic_criteria": "Admitted through CAP round in Maharashtra",
        "official_portal": "MahaDBT Portal (mahadbt.maharashtra.gov.in)",
        "necessary_documents": [
            "Domicile Certificate of Maharashtra",
            "Income Certificate issued by Collector / Tahsildar (≤ ₹8 Lakhs)",
            "CAP Allotment Letter",
            "Class 10th & 12th Marksheet",
            "Aadhaar Card Linked to Bank Account"
        ],
        "description": "Frees EWS and open category meritorious students in Maharashtra from heavy tuition fee burdens."
    },

    # Category 5: Merit-Based Scholarships
    {
        "id": "central_sector_merit",
        "category_id": 5,
        "category_name": "Merit-Based Scholarships",
        "scholarship_name": "University / National Merit Rank Scholarship",
        "min_gpa": 8.5,
        "max_income": 1000000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹10,000 to ₹1,00,000/year (Full Tuition Fee + Merit Cash Award)",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Top 3 Rank holders in University / Department Semester Exams",
        "official_portal": "University Examination Branch / National Portal",
        "necessary_documents": [
            "Official Grade Sheet / Mark Card of Previous Semesters",
            "Department Rank Certificate signed by HOD & Dean",
            "Student College ID Card",
            "Bank Account Details for Direct Benefit Transfer"
        ],
        "description": "Rewards academic excellence, consistency, and top department positions with prestigious merit stipends."
    },

    # Category 6: Need-Based Scholarships
    {
        "id": "tata_trust_need",
        "category_id": 6,
        "category_name": "Need-Based Scholarships",
        "scholarship_name": "Tata Trust Medical & Engineering Scholarship",
        "min_gpa": 7.0,
        "max_income": 500000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH", "MBBS"],
        "eligible_years": [2, 3, 4],
        "benefits": "30% to 80% of total annual college tuition fees",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Family income under ₹5 Lakhs and good academic standing",
        "official_portal": "Tata Trusts Online Application Portal",
        "necessary_documents": [
            "Current Year Paid Fee Receipts",
            "Annual Family Income Certificate / ITR of Parents",
            "Class 10th, 12th & Semester Marksheets",
            "Statement of Purpose (SOP) explaining financial need",
            "Aadhaar Card and Student Cancelled Cheque"
        ],
        "description": "Supports undergraduate students facing severe financial constraints to complete professional degrees."
    },
    {
        "id": "sitaram_jindal",
        "category_id": 6,
        "category_name": "Need-Based Scholarships",
        "scholarship_name": "Sitaram Jindal Foundation Scholarship",
        "min_gpa": 6.5,
        "max_income": 400000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹1,500 to ₹3,200/month stipend",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Minimum 65% marks for boys, 60% for girls in qualifying exam",
        "official_portal": "Sitaram Jindal Foundation (sitaramjindalfoundation.org)",
        "necessary_documents": [
            "Class 12th / Degree Marksheet",
            "Income Certificate (≤ ₹4 Lakhs/yr)",
            "Certificate from College Principal",
            "Physical Handicap Certificate (if applicable)",
            "Aadhaar Card and Bank Account Copy"
        ],
        "description": "Long-running philanthropic scholarship providing monthly financial relief to economically underprivileged UG students."
    },

    # Category 7: Scholarships for Girls
    {
        "id": "cbse_single_girl",
        "category_id": 7,
        "category_name": "Scholarships for Girls",
        "scholarship_name": "CBSE / UGC Single Girl Child Scholarship",
        "min_gpa": 6.0,
        "max_income": 1000000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹1,000/month (₹12,000/year) stipend for undergraduate studies",
        "caste_category": "All",
        "gender": "Female",
        "academic_criteria": "Single Girl Child of parents who scored 60%+ in CBSE Class X/XII",
        "official_portal": "CBSE Official Portal / UGC Portal",
        "necessary_documents": [
            "Affidavit on ₹50 Stamp Paper duly attested by First Class Magistrate / SDM stating Single Girl Child status",
            "Class 10th & 12th CBSE Marksheets",
            "School / College Verification Form",
            "Aadhaar Card & Student Bank Passbook"
        ],
        "description": "Recognizes the efforts of parents in promoting education among girls and provides monthly financial support."
    },

    # Category 8: PwD Scholarships
    {
        "id": "national_pwd",
        "category_id": 8,
        "category_name": "Scholarships for Students with Disabilities (PwD)",
        "scholarship_name": "National Scholarship for Students with Disabilities",
        "min_gpa": 5.0,
        "max_income": 600000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4, 5],
        "benefits": "Tuition Fee + ₹4,000/month living allowance + ₹4,000/year book allowance + Assistive computer devices",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Benchmark disability of 40% or more validated by medical board",
        "official_portal": "National Scholarship Portal (NSP)",
        "necessary_documents": [
            "UDID Card / Disability Certificate (≥ 40% disability)",
            "Family Income Certificate (≤ ₹6 Lakhs)",
            "Class 10th and 12th Marksheets",
            "Fee Receipt & Bonafide Certificate",
            "Aadhaar Card & Bank Account Passbook"
        ],
        "description": "Comprehensive central assistance providing assistive tech, living stipends, and course fee waivers for disabled students."
    },

    # Category 9: Institutional Scholarships
    {
        "id": "inst_iit_bits_merit",
        "category_id": 9,
        "category_name": "Institutional Scholarships",
        "scholarship_name": "IIT / BITS / VIT Merit-cum-Means Institute Scholarship",
        "min_gpa": 8.0,
        "max_income": 500000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "100% Tuition Fee Waiver + ₹1,000/month pocket stipend",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Minimum 8.0 CGPA and family income below institute threshold",
        "official_portal": "Respective Institute Student Affairs Portal",
        "necessary_documents": [
            "Parents' Income Tax Returns (ITR V) / Salary Slip",
            "Current Grade Card / CGPA Transcript",
            "Institute Fee Receipt",
            "Aadhaar Card"
        ],
        "description": "Internal institutional grants waiving tuition fees for top performing students with constrained family finances."
    },

    # Category 10: Sports Scholarships
    {
        "id": "sai_sports_grant",
        "category_id": 10,
        "category_name": "Sports Scholarships",
        "scholarship_name": "Sports Authority of India (SAI) & University Sports Quota Grant",
        "min_gpa": 5.0,
        "max_income": 1200000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "100% Free Hostel & Sports Kit Allowance + ₹18,000 - ₹50,000/year Cash Award",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Represented State / Country in National or International Championships or All-India Inter-University Tournaments",
        "official_portal": "Sports Authority of India (sportsauthorityofindia.nic.in)",
        "necessary_documents": [
            "National / International Sports Participation Certificates verified by Federation",
            "Inter-University Medal Certificate",
            "Medical Fitness Certificate from Sports Doctor",
            "College Bonafide Certificate",
            "Aadhaar Card & Bank Account Details"
        ],
        "description": "Supports student athletes who balance rigorous sports training alongside undergraduate academic degrees."
    },

    # Category 11: Research & Innovation
    {
        "id": "aicte_idea_lab",
        "category_id": 11,
        "category_name": "Research and Innovation Scholarships",
        "scholarship_name": "Student Innovation Fellowship & AICTE IDEA Lab Grant",
        "min_gpa": 7.0,
        "max_income": 1500000.0,
        "eligible_departments": ["CSE", "ECE", "EEE", "IT", "CIVIL", "MECH"],
        "eligible_years": [2, 3, 4],
        "benefits": "Up to ₹1,00,000 seed grant for prototype development, 3D printing, and patent filing support",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Winning National Hackathons or working on verified hardware/software innovation patent proposals",
        "official_portal": "AICTE Innovation Cell / DST iDEX",
        "necessary_documents": [
            "Detailed Project Proposal & Prototype Design Document",
            "Hackathon Winner / Finalist Certificate",
            "Faculty Mentor Recommendation Letter",
            "College Innovation Council Approval",
            "Aadhaar Card and Student Bank Account"
        ],
        "description": "Fosters startup culture, prototyping, patenting, and hardware innovation among young engineering undergraduates."
    },

    # Category 12: International Scholarships
    {
        "id": "commonwealth_global_ug",
        "category_id": 12,
        "category_name": "International Scholarships for Indian UG Students",
        "scholarship_name": "Commonwealth / Global UGRAD Overseas Exchange Scholarship",
        "min_gpa": 8.5,
        "max_income": 1500000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [2, 3],
        "benefits": "Full International Tuition Fee + Roundtrip Airfare + Monthly Living Allowance ($1,500/month) + Health Insurance",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Top academic grades, TOEFL/IELTS score, and strong leadership portfolio",
        "official_portal": "World Learning / Commonwealth Scholarship Commission",
        "necessary_documents": [
            "Valid Indian Passport",
            "Official University Academic Transcripts (All Semesters)",
            "IELTS / TOEFL English Proficiency Scorecard",
            "Two Academic Letters of Recommendation (LOR)",
            "Personal Statement of Purpose (SOP)",
            "Aadhaar Card"
        ],
        "description": "Enables outstanding Indian undergraduate students to spend a semester or full degree program in top universities in the UK, USA, Germany, or New Zealand."
    },

    # Category 13: Corporate Scholarships
    {
        "id": "reliance_foundation_ug",
        "category_id": 13,
        "category_name": "Corporate Scholarships",
        "scholarship_name": "Reliance Foundation Undergraduate Scholarship",
        "min_gpa": 7.5,
        "max_income": 1500000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1],
        "benefits": "Up to ₹2,00,000 across the duration of the undergraduate degree",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "First year UG student scoring 60%+ in 12th standard and clearing Reliance Aptitude Test",
        "official_portal": "Reliance Foundation Scholarship Portal (scholarships.reliancefoundation.org)",
        "necessary_documents": [
            "Class 12th Board Marksheet",
            "Family Income Certificate / Salary Slip (Income < ₹2.5L gets preference)",
            "College Admission Proof & Fee Receipt",
            "Aadhaar Card",
            "Bank Account Details"
        ],
        "description": "Supports up to 5,000 meritorious Indian undergraduate students annually to pursue any discipline of higher education."
    },
    {
        "id": "hdfc_badhte_kadam",
        "category_id": 13,
        "category_name": "Corporate Scholarships",
        "scholarship_name": "HDFC Bank Parivartan's ECSS Scholarship",
        "min_gpa": 6.0,
        "max_income": 600000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4],
        "benefits": "₹50,000/year for undergraduate students",
        "caste_category": "All",
        "gender": "All",
        "academic_criteria": "Students facing personal or family financial crisis (e.g. loss of earning parent)",
        "official_portal": "Buddy4Study / HDFC Parivartan Portal",
        "necessary_documents": [
            "Class 12th / Previous Semester Marksheet (Min 55% marks)",
            "Proof of Family Crisis (Death cert of breadwinner / Job loss letter / Medical emergency bills)",
            "Income Certificate (≤ ₹6 Lakhs)",
            "College Admission Letter & Fee Receipt",
            "Aadhaar Card and Student Bank Passbook"
        ],
        "description": "Crisis support scholarship ensuring vulnerable students do not drop out due to sudden family hardship."
    },

    # Category 14: Loan Interest Subsidy
    {
        "id": "csis_loan_subsidy",
        "category_id": 14,
        "category_name": "Education Loan Interest Subsidy Schemes",
        "scholarship_name": "Central Sector Interest Subsidy Scheme (CSIS)",
        "min_gpa": 5.0,
        "max_income": 450000.0,
        "eligible_departments": ["ALL"],
        "eligible_years": [1, 2, 3, 4, 5],
        "benefits": "100% Interest Subsidy on Education Loans during the Moratorium Period (Course Duration + 1 Year)",
        "caste_category": "Economically Weaker Sections (EWS)",
        "gender": "All",
        "academic_criteria": "Availing education loan from scheduled bank for professional UG degree",
        "official_portal": "Canara Bank CSIS Portal / JanSamarth Portal (jansamarth.in)",
        "necessary_documents": [
            "Education Loan Sanction Letter from Bank",
            "Income Certificate issued by designated State Authority (Family Income ≤ ₹4.5 Lakhs)",
            "College Admission Letter & Bonafide Certificate",
            "Class 10th and 12th Marksheets",
            "Aadhaar Card of Student and Co-borrower Parent"
        ],
        "description": "Govt. of India pays full interest on education loans during the study period so low-income students bear zero interest debt until graduation."
    }
]
