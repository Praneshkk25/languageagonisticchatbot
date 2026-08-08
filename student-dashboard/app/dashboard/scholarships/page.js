"use client";

import { useState } from "react";

export default function ScholarshipsPage() {
    const categories = [
        { id: 1, name: "Central Government Scholarships", count: "2 Available", total: 2 },
        { id: 2, name: "Category Based Scholarships", count: "4 Available", total: 4 },
        { id: 3, name: "AICTE Scholarships", count: "2 Available", total: 2 },
        { id: 4, name: "State Government Scholarships", count: "1 Available", total: 1 },
        { id: 5, name: "Merit Based Scholarships", count: "2 Available", total: 2 },
        { id: 6, name: "Need Based Scholarships", count: "2 Available", total: 2 },
        { id: 7, name: "Scholarships for Girls", count: "1 Available", total: 1 },
        { id: 8, name: "Scholarships for Students with Disabilities (PwD)", count: "1 Available", total: 1 },
        { id: 9, name: "Institutional Scholarships", count: "1 Available", total: 1 },
        { id: 10, name: "Sports Scholarships", count: "1 Available", total: 1 },
        { id: 11, name: "Research and Innovation Scholarships", count: "1 Available", total: 1 },
        { id: 12, name: "International Scholarships for Indian UG Students", count: "1 Available", total: 1 },
        { id: 13, name: "Corporate Scholarships", count: "2 Available", total: 2 },
        { id: 14, name: "Education Loan Interest Subsidy Schemes", count: "1 Available", total: 1 },
    ];

    const [scholarships] = useState([
        // CATEGORY #1: Central Government Scholarships (2)
        {
            id: 101,
            categoryId: 1,
            scholarship_name: "Central Sector Scheme of Scholarships for College Students",
            category_name: "Central Government Scholarships",
            benefits: "Financial Benefit: ₹12,000 per annum for graduation",
            min_gpa: 7.5,
            max_income: 450000,
            income_label: "₹4.5 Lakhs",
            caste_quota: "All Quotas (Top 20th Percentile)",
            description: "MHRD scholarship for meritorious students pursuing higher education in professional degree courses.",
            documents: ["12th Marksheet", "Income Certificate", "Bonafide Student Certificate", "Aadhaar Linked Bank Passbook"]
        },
        {
            id: 102,
            categoryId: 1,
            scholarship_name: "PM's Scholarship Scheme for Central Armed Police Forces (CAPF)",
            category_name: "Central Government Scholarships",
            benefits: "Financial Benefit: ₹36,000 per annum for male / female wards",
            min_gpa: 6.0,
            max_income: 600000,
            income_label: "₹6.0 Lakhs",
            caste_quota: "Wards of Deceased CAPF & AR Personnel",
            description: "Encouraging higher technical and professional education for dependent wards of ex-servicemen.",
            documents: ["CAPF Service/Discharge Certificate", "Academic Marksheets", "Institute Bonafide", "Bank Account Details"]
        },

        // CATEGORY #2: Category Based Scholarships (4)
        {
            id: 201,
            categoryId: 2,
            scholarship_name: "Post-Matric Scholarship Scheme for SC/ST Students",
            category_name: "Category Based Scholarships",
            benefits: "Financial Benefit: 100% Tuition Fee Waiver + Maintenance Allowance",
            min_gpa: 6.0,
            max_income: 250000,
            income_label: "₹2.5 Lakhs",
            caste_quota: "Scheduled Caste (SC) / Scheduled Tribe (ST)",
            description: "Full state financial support covering tuition fees, examination fees, and monthly maintenance allowance.",
            documents: ["Community Certificate (SC/ST)", "Income Certificate (Tehsildar)", "Previous Year Marksheets", "Institute Bonafide"]
        },
        {
            id: 202,
            categoryId: 2,
            scholarship_name: "Post-Matric Scholarship for OBC / EBC Students",
            category_name: "Category Based Scholarships",
            benefits: "Financial Benefit: ₹25,000 Tuition Fee Subsidy per year",
            min_gpa: 6.5,
            max_income: 250000,
            income_label: "₹2.5 Lakhs",
            caste_quota: "Other Backward Classes (OBC) / EBC",
            description: "Financial assistance provided by the State Department of Backward Classes Welfare for degree students.",
            documents: ["OBC NCL Certificate", "Income Declaration", "College Fee Receipts", "Aadhaar Card"]
        },
        {
            id: 203,
            categoryId: 2,
            scholarship_name: "Minority Community Higher Education Grant",
            category_name: "Category Based Scholarships",
            benefits: "Financial Benefit: ₹30,000 Annual Stipend",
            min_gpa: 6.5,
            max_income: 250000,
            income_label: "₹2.5 Lakhs",
            caste_quota: "Muslim / Christian / Sikh / Buddhist / Jain",
            description: "Special state grant for registered minority community students with good academic standing.",
            documents: ["Minority Community Certificate", "Income Certificate", "Bonafide Certificate", "College Fee Receipt"]
        },
        {
            id: 204,
            categoryId: 2,
            scholarship_name: "Economically Weaker Section (EWS) Merit Assistance",
            category_name: "Category Based Scholarships",
            benefits: "Financial Benefit: ₹20,000 Academic Support",
            min_gpa: 7.0,
            max_income: 300000,
            income_label: "₹3.0 Lakhs",
            caste_quota: "EWS Quota",
            description: "Government financial grant for economically weaker section students not covered under SC/ST/OBC.",
            documents: ["EWS Certificate", "Income Proof", "Academic Transcripts", "Bank Account Details"]
        },

        // CATEGORY #3: AICTE Scholarships (2)
        {
            id: 301,
            categoryId: 3,
            scholarship_name: "AICTE Pragati Scholarship for Girl Students",
            category_name: "AICTE Scholarships",
            benefits: "Financial Benefit: ₹50,000 per annum for technical education",
            min_gpa: 7.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "Girl Students in Technical Degrees",
            description: "AICTE scheme to empower women pursuing technical degree education in approved engineering institutions.",
            documents: ["AICTE Allotment Letter", "Family Income Certificate", "Aadhaar Linked Bank Passbook", "Institute Verification"]
        },
        {
            id: 302,
            categoryId: 3,
            scholarship_name: "AICTE Saksham Scholarship for Specially-Abled Students",
            category_name: "AICTE Scholarships",
            benefits: "Financial Benefit: ₹50,000 per annum + Assistive Device Allowance",
            min_gpa: 6.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "Specially-Abled (Disability ≥ 40%)",
            description: "Financial assistance provided by AICTE to encourage differently-abled students to pursue technical education.",
            documents: ["Disability Certificate (Govt. Medical Board)", "Income Certificate", "AICTE Admission Letter", "Bank Details"]
        },

        // CATEGORY #4: State Government Scholarships (1)
        {
            id: 401,
            categoryId: 4,
            scholarship_name: "State Higher Education Tuition Fee Reimbursement Scheme",
            category_name: "State Government Scholarships",
            benefits: "Financial Benefit: 100% Tuition Fee Reimbursement",
            min_gpa: 7.0,
            max_income: 300000,
            income_label: "₹3.0 Lakhs",
            caste_quota: "State Domicile Students",
            description: "Reimbursement of full tuition fees for government quota admitted engineering students.",
            documents: ["Domicile Certificate", "College Allotment Order", "Income Certificate", "Fee Challan Receipts"]
        },

        // CATEGORY #5: Merit Based Scholarships (2)
        {
            id: 501,
            categoryId: 5,
            scholarship_name: "Sona Gold Medal Merit Scholarship",
            category_name: "Merit Based Scholarships",
            benefits: "Financial Benefit: Full Tuition Waiver + Laptop Allowance",
            min_gpa: 8.5,
            max_income: 400000,
            income_label: "₹4.0 Lakhs",
            caste_quota: "Top Rankers (All Categories)",
            description: "Full tuition waiver and free laptop allowance for high CGPA engineering students.",
            documents: ["Semester Marksheets (CGPA ≥ 8.5)", "Bonafide Student Certificate", "Aadhaar Card", "Bank Passbook Copy"]
        },
        {
            id: 502,
            categoryId: 5,
            scholarship_name: "Chairman's Academic Excellence Award",
            category_name: "Merit Based Scholarships",
            benefits: "Financial Benefit: ₹40,000 Cash Prize & Certificate",
            min_gpa: 8.8,
            max_income: 600000,
            income_label: "₹6.0 Lakhs",
            caste_quota: "Top 3 Department Rankers",
            description: "Annual academic excellence reward for top rankers in computer science and technology.",
            documents: ["Official Transcript", "HOD Recommendation Letter", "Student ID Card", "Bank Account Details"]
        },

        // CATEGORY #6: Need Based Scholarships (2)
        {
            id: 601,
            categoryId: 6,
            scholarship_name: "Financial Hardship Education Relief Fund",
            category_name: "Need Based Scholarships",
            benefits: "Financial Benefit: ₹35,000 Emergency Fee Aid",
            min_gpa: 6.5,
            max_income: 150000,
            income_label: "₹1.5 Lakhs",
            caste_quota: "Low Income Families",
            description: "Special emergency fee assistance for students facing extreme financial difficulties.",
            documents: ["Income Certificate", "Family Situation Declaration", "College Fee Statement", "Aadhaar Card"]
        },
        {
            id: 602,
            categoryId: 6,
            scholarship_name: "Single Parent Family Student Scholarship",
            category_name: "Need Based Scholarships",
            benefits: "Financial Benefit: 50% Tuition Fee Waiver",
            min_gpa: 6.5,
            max_income: 200000,
            income_label: "₹2.0 Lakhs",
            caste_quota: "Single Parent / Orphan Wards",
            description: "Support for students raised by single parents or guardians.",
            documents: ["Single Parent Certificate / Death Certificate", "Income Certificate", "Academic Marksheets", "Institute Bonafide"]
        },

        // CATEGORY #7: Scholarships for Girls (1)
        {
            id: 701,
            categoryId: 7,
            scholarship_name: "Sona Women Empowerment Foundation Aid",
            category_name: "Scholarships for Girls",
            benefits: "Financial Benefit: 100% Free Hostel Accommodation & Bus Transport",
            min_gpa: 8.0,
            max_income: 400000,
            income_label: "₹4.0 Lakhs",
            caste_quota: "Female Undergraduates",
            description: "Institutional foundation support offering free hostel accommodation and transportation for girl students.",
            documents: ["Academic Transcripts", "Income Certificate", "Residential Proof", "Head of Department Recommendation"]
        },

        // CATEGORY #8: Scholarships for Students with Disabilities (PwD) (1)
        {
            id: 801,
            categoryId: 8,
            scholarship_name: "National PwD Empowerment Fellowship",
            category_name: "Scholarships for Students with Disabilities (PwD)",
            benefits: "Financial Benefit: ₹45,000 Annual Stipend + Book Allowance",
            min_gpa: 5.5,
            max_income: 600000,
            income_label: "₹6.0 Lakhs",
            caste_quota: "PwD Category (Disability ≥ 40%)",
            description: "Central government fellowship promoting inclusive higher education for differently-abled students.",
            documents: ["Disability Certificate (Medical Board)", "Bonafide Certificate", "Bank Passbook Copy", "Aadhaar Card"]
        },

        // CATEGORY #9: Institutional Scholarships (1)
        {
            id: 901,
            categoryId: 9,
            scholarship_name: "College Founder's Memorial Trust Grant",
            category_name: "Institutional Scholarships",
            benefits: "Financial Benefit: ₹25,000 Annual Scholarship",
            min_gpa: 7.5,
            max_income: 350000,
            income_label: "₹3.5 Lakhs",
            caste_quota: "All Registered Students",
            description: "Institutional trust grant awarded to deserving students based on academic standing and campus involvement.",
            documents: ["College ID", "Semester Marksheet", "Income Certificate", "Faculty Recommendation"]
        },

        // CATEGORY #10: Sports Scholarships (1)
        {
            id: 1001,
            categoryId: 10,
            scholarship_name: "State & National Sports Champion Fee Waiver",
            category_name: "Sports Scholarships",
            benefits: "Financial Benefit: 100% Sports Fee Waiver + Free Sports Kit",
            min_gpa: 6.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "State / National Level Athletes",
            description: "Full tuition fee waiver for medal winners in inter-university or national level sports tournaments.",
            documents: ["Sports Achievement Certificates (Form 1/2/3)", "Physical Fitness Certificate", "Academic Marksheet", "College ID"]
        },

        // CATEGORY #11: Research and Innovation Scholarships (1)
        {
            id: 1101,
            categoryId: 11,
            scholarship_name: "Student R&D Patent & Innovation Grant",
            category_name: "Research and Innovation Scholarships",
            benefits: "Financial Benefit: ₹50,000 Project & Patent Funding",
            min_gpa: 8.0,
            max_income: 1000000,
            income_label: "₹10.0 Lakhs",
            caste_quota: "UG Student Researchers",
            description: "Funding for innovative student hardware/software projects, research papers, and patent filings.",
            documents: ["Project Proposal / Abstract", "Faculty Guide Endorsement", "Academic Transcripts", "Bank Account Details"]
        },

        // CATEGORY #12: International Scholarships for Indian UG Students (1)
        {
            id: 1201,
            categoryId: 12,
            scholarship_name: "Global Student Exchange & Immersion Scholarship",
            category_name: "International Scholarships for Indian UG Students",
            benefits: "Financial Benefit: ₹1,50,000 Travel & Living Allowance",
            min_gpa: 8.5,
            max_income: 1200000,
            income_label: "₹12.0 Lakhs",
            caste_quota: "UG Students in Semester 5-7",
            description: "Partial funding for attending international summer schools and foreign university exchange programs.",
            documents: ["Foreign Partner University Acceptance", "Valid Passport", "Academic Transcripts (CGPA ≥ 8.5)", "Statement of Purpose"]
        },

        // CATEGORY #13: Corporate Scholarships (2)
        {
            id: 1301,
            categoryId: 13,
            scholarship_name: "Tech Corp CSR Women in Engineering Scholarship",
            category_name: "Corporate Scholarships",
            benefits: "Financial Benefit: ₹75,000 per year + Direct Internship Offer",
            min_gpa: 7.5,
            max_income: 500000,
            income_label: "₹5.0 Lakhs",
            caste_quota: "Female CS / IT Engineering Students",
            description: "Corporate CSR fellowship providing financial sponsorship and guaranteed summer internship.",
            documents: ["10th/12th/UG Marksheets", "Income Certificate", "Resume / CV", "Bonafide Certificate"]
        },
        {
            id: 1302,
            categoryId: 13,
            scholarship_name: "Infosys Foundation STEM Scholarship",
            category_name: "Corporate Scholarships",
            benefits: "Financial Benefit: ₹60,000 per annum + Mentorship",
            min_gpa: 7.5,
            max_income: 450000,
            income_label: "₹4.5 Lakhs",
            caste_quota: "STEM Degree Students",
            description: "Corporate scholarship program supporting underprivileged students pursuing technical degrees.",
            documents: ["Income Proof", "College ID", "Semester Transcripts", "Bank Account Passbook"]
        },

        // CATEGORY #14: Education Loan Interest Subsidy Schemes (1)
        {
            id: 1401,
            categoryId: 14,
            scholarship_name: "Central Scheme to Provide Interest Subsidy (CSIS) on Education Loans",
            category_name: "Education Loan Interest Subsidy Schemes",
            benefits: "Financial Benefit: 100% Loan Interest Subsidy during Moratorium Period",
            min_gpa: 6.0,
            max_income: 450000,
            income_label: "₹4.5 Lakhs",
            caste_quota: "Bank Education Loan Borrowers",
            description: "Full interest subsidy on education loans sanctioned by scheduled banks during the course moratorium period.",
            documents: ["Bank Education Loan Sanction Letter", "Tehsildar Income Certificate", "Bonafide Certificate", "Aadhaar Card"]
        }
    ]);

    // Student Profile for Eligibility Evaluation
    const studentProfile = {
        name: "Pranesh K K",
        id: "2023CS001",
        cgpa: 8.5,
        department: "CSE",
        familyIncome: 250000,
        category: "General / Merit"
    };

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [detailsModalItem, setDetailsModalItem] = useState(null);
    const [eligibilityModalItem, setEligibilityModalItem] = useState(null);

    // Passkey State
    const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
    const [targetScholarshipForDownload, setTargetScholarshipForDownload] = useState(null);
    const [passkey1, setPasskey1] = useState("123456");
    const [passkey2, setPasskey2] = useState("654321");
    const [passkeyError, setPasskeyError] = useState("");
    const [passkeyVerified, setPasskeyVerified] = useState(false);
    const [downloadSuccessMessage, setDownloadSuccessMessage] = useState("");

    const handleCategoryClick = (catId) => {
        setSelectedCategory(prev => prev === catId ? null : catId);
    };

    const triggerFormDownload = (sch) => {
        setTargetScholarshipForDownload(sch);
        if (!passkeyVerified) {
            setPasskeyError("");
            setPasskeyModalOpen(true);
        } else {
            executeDownload(sch);
        }
    };

    const verifyPasskeys = () => {
        if (passkey1 === "123456" && passkey2 === "654321") {
            setPasskeyVerified(true);
            setPasskeyModalOpen(false);
            if (targetScholarshipForDownload) {
                executeDownload(targetScholarshipForDownload);
            }
        } else {
            setPasskeyError("Invalid Double Passkey. Please verify Passkey 1 (123456) and Passkey 2 (654321).");
        }
    };

    const executeDownload = (sch) => {
        setDownloadSuccessMessage(`Downloading Official Application Form for ${sch.scholarship_name}...`);
        setTimeout(() => setDownloadSuccessMessage(""), 4000);
    };

    const filteredScholarships = scholarships.filter(s => {
        const matchesCategory = selectedCategory === null || s.categoryId === selectedCategory;
        const matchesQuery = !searchQuery || 
            s.scholarship_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>⭐ Indian Undergraduate Scholarships Hub</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                    14 Categories of Scholarships for Graduation
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    Explore Central & State Govt. schemes, AICTE grants, SC/ST/OBC/Minority quotas, Merit & Need-based funding, Girls & PwD aid, Corporate awards, and Interest Subsidies. Select any category below to view matching scholarship schemes!
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <span className="badge success">☁️ Cloud Storage Vault Protection (Double Passkey Protected)</span>
                    <span className="badge warning">🛡️ 2-Factor Double Passkey authorization enabled</span>
                </div>
            </section>

            {/* DOWNLOAD TOAST */}
            {downloadSuccessMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    ✓ {downloadSuccessMessage}
                </div>
            )}

            {/* TOOLBAR SEARCH & FILTER */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search by scholarship name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {selectedCategory && (
                    <button className="button danger" onClick={() => setSelectedCategory(null)}>
                        Clear Category Filter (Category #{selectedCategory})
                    </button>
                )}
            </div>

            {/* 14 CATEGORIES GRID PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">14 Scholarship Categories</div>
                        <div className="panel-subtitle">
                            {selectedCategory 
                                ? `Active Category Filter: #${selectedCategory} - ${categories.find(c => c.id === selectedCategory)?.name}` 
                                : "Click any category card below to filter available scholarships"}
                        </div>
                    </div>
                    <span className="badge">{categories.length} Categories</span>
                </div>

                <div style={{ padding: '20px' }}>
                    <div className="grid grid-4">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const categoryMatchingCount = scholarships.filter(s => s.categoryId === cat.id).length;
                            return (
                                <div 
                                    key={cat.id} 
                                    className="feature-card"
                                    onClick={() => handleCategoryClick(cat.id)}
                                    style={{ 
                                        padding: '14px', 
                                        cursor: 'pointer',
                                        borderColor: isSelected ? 'var(--primary-2)' : 'var(--border)',
                                        background: isSelected ? 'rgba(91, 53, 232, 0.25)' : '#0a142b',
                                        boxShadow: isSelected ? '0 0 15px rgba(113, 60, 255, 0.3)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="badge" style={{ background: isSelected ? 'var(--primary)' : 'var(--primary-soft)', color: '#ffffff' }}>
                                            #{cat.id}
                                        </span>
                                        {isSelected && <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 800 }}>✓ Selected</span>}
                                    </div>
                                    <div className="feature-title" style={{ marginTop: '10px', fontSize: '13px', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                                        {cat.name}
                                    </div>
                                    <div className="feature-description" style={{ fontSize: '11px', color: isSelected ? '#bcaaff' : '#707b98', marginTop: '4px' }}>
                                        {categoryMatchingCount} Available
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* AVAILABLE SCHOLARSHIPS DATA ROWS */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Available Scholarships ({filteredScholarships.length})</div>
                        <div className="panel-subtitle">
                            {selectedCategory 
                                ? `Showing all ${filteredScholarships.length} scholarships for Category #${selectedCategory} - ${categories.find(c => c.id === selectedCategory)?.name}` 
                                : "Showing all available graduation scholarship schemes"}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredScholarships.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎓</div>
                            <div className="empty-title">No scholarships matched your filter</div>
                            <div className="empty-description">Try selecting a different category or clear the search query.</div>
                            <button className="button primary" style={{ marginTop: '14px' }} onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}>
                                Reset All Filters
                            </button>
                        </div>
                    ) : (
                        filteredScholarships.map((sch) => (
                            <div key={sch.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
                                <div className="data-icon">🎓</div>

                                <div className="data-content" style={{ minWidth: '260px' }}>
                                    <div className="data-title" style={{ fontSize: '15px', color: '#ffffff' }}>{sch.scholarship_name}</div>
                                    <div className="data-meta">
                                        <span className="badge">{sch.category_name}</span>
                                        <span className="badge">{sch.benefits}</span>
                                        <span className="badge">Min CGPA: {sch.min_gpa}</span>
                                        <span className="badge">Max Income: {sch.income_label}</span>
                                    </div>
                                </div>

                                {/* THREE INTERACTIVE ACTION BUTTONS */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                                    <button className="button" onClick={() => setDetailsModalItem(sch)}>
                                        📄 View Details
                                    </button>

                                    <button className="button" onClick={() => setEligibilityModalItem(sch)} style={{ borderColor: 'var(--primary-2)', color: '#c2b5ff' }}>
                                        👤 Check Eligibility
                                    </button>

                                    <button className="button primary" onClick={() => triggerFormDownload(sch)}>
                                        ⇩ Download Application Form
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* 1. VIEW DETAILS MODAL */}
            {detailsModalItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '600px', width: '100%', padding: '28px', background: '#0a142b', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span className="badge" style={{ marginBottom: '6px' }}>{detailsModalItem.category_name}</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{detailsModalItem.scholarship_name}</h3>
                            </div>
                            <button className="button danger" onClick={() => setDetailsModalItem(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
                            {detailsModalItem.description}
                        </p>

                        <div style={{ background: '#081229', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', marginBottom: '4px' }}>FINANCIAL COVERAGE & BENEFITS</div>
                            <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>{detailsModalItem.benefits}</div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>REQUIRED DOCUMENTS CHECKLIST</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {detailsModalItem.documents.map((doc, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: 'var(--success)' }}>✓</span>
                                        <span>{doc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="button" onClick={() => setDetailsModalItem(null)}>Close</button>
                            <button className="button primary" onClick={() => { setDetailsModalItem(null); triggerFormDownload(detailsModalItem); }}>
                                Download Application Form
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. CHECK ELIGIBILITY MODAL */}
            {eligibilityModalItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '580px', width: '100%', padding: '28px', background: '#0a142b', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span className="badge success" style={{ marginBottom: '6px' }}>Profile Eligibility Evaluation</span>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{eligibilityModalItem.scholarship_name}</h3>
                            </div>
                            <button className="button danger" onClick={() => setEligibilityModalItem(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        {/* STUDENT PROFILE RECAP */}
                        <div style={{ background: '#081229', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Student Name</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{studentProfile.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Roll / Student ID</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{studentProfile.id}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current CGPA</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{studentProfile.cgpa} CGPA</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Annual Family Income</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>₹{(studentProfile.familyIncome/100000).toFixed(1)} Lakhs</div>
                            </div>
                        </div>

                        {/* EVALUATION VERDICT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>CRITERIA MATCH RESULT:</div>

                            <div style={{ padding: '12px', borderRadius: '8px', background: studentProfile.cgpa >= eligibilityModalItem.min_gpa ? 'rgba(66, 214, 164, 0.12)' : 'rgba(255, 82, 104, 0.12)', border: `1px solid ${studentProfile.cgpa >= eligibilityModalItem.min_gpa ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: '#fff' }}>Min CGPA Requirement ({eligibilityModalItem.min_gpa})</span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: studentProfile.cgpa >= eligibilityModalItem.min_gpa ? 'var(--success)' : 'var(--danger)' }}>
                                    {studentProfile.cgpa >= eligibilityModalItem.min_gpa ? '✓ ELIGIBLE (Your CGPA: 8.5)' : '✕ INELIGIBLE'}
                                </span>
                            </div>

                            <div style={{ padding: '12px', borderRadius: '8px', background: studentProfile.familyIncome <= eligibilityModalItem.max_income ? 'rgba(66, 214, 164, 0.12)' : 'rgba(255, 82, 104, 0.12)', border: `1px solid ${studentProfile.familyIncome <= eligibilityModalItem.max_income ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: '#fff' }}>Max Income Limit ({eligibilityModalItem.income_label})</span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: studentProfile.familyIncome <= eligibilityModalItem.max_income ? 'var(--success)' : 'var(--danger)' }}>
                                    {studentProfile.familyIncome <= eligibilityModalItem.max_income ? '✓ ELIGIBLE (Your Income: ₹2.5L)' : '✕ INELIGIBLE'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="button" onClick={() => setEligibilityModalItem(null)}>Close</button>
                            <button className="button primary" onClick={() => { setEligibilityModalItem(null); triggerFormDownload(eligibilityModalItem); }}>
                                Proceed to Download Form
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. DOUBLE PASSKEY AUTHORIZATION MODAL */}
            {passkeyModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '480px', width: '100%', padding: '28px', background: '#0a142b', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>🔐 2-Factor Double Passkey Authorization</h3>
                            <button className="button danger" onClick={() => setPasskeyModalOpen(false)} style={{ height: '30px', padding: '0 8px' }}>✕</button>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Cloud-stored scholarship application forms are protected. Enter your Double Passkeys to authorize download.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Passkey 1 (Default: 123456)</label>
                                <input type="password" className="input" value={passkey1} onChange={(e) => setPasskey1(e.target.value)} />
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Passkey 2 (Default: 654321)</label>
                                <input type="password" className="input" value={passkey2} onChange={(e) => setPasskey2(e.target.value)} />
                            </div>

                            {passkeyError && (
                                <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 700 }}>{passkeyError}</div>
                            )}
                        </div>

                        <button className="button primary" style={{ width: '100%' }} onClick={verifyPasskeys}>
                            Verify Passkeys & Download Form
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
