"use client";

import { useState, useEffect } from "react";

export default function AdminScholarshipsManager() {
    const categories = [
        { id: 1, name: "Central Government Scholarships" },
        { id: 2, name: "Category Based Scholarships" },
        { id: 3, name: "AICTE Scholarships" },
        { id: 4, name: "State Government Scholarships" },
        { id: 5, name: "Merit Based Scholarships" },
        { id: 6, name: "Need Based Scholarships" },
        { id: 7, name: "Scholarships for Girls" },
        { id: 8, name: "Scholarships for Students with Disabilities (PwD)" },
        { id: 9, name: "Institutional Scholarships" },
        { id: 10, name: "Sports Scholarships" },
        { id: 11, name: "Research and Innovation Scholarships" },
        { id: 12, name: "International Scholarships for Indian UG Students" },
        { id: 13, name: "Corporate Scholarships" },
        { id: 14, name: "Education Loan Interest Subsidy Schemes" },
    ];

    const [scholarships, setScholarships] = useState([
        {
            id: 1,
            categoryId: 1,
            scholarship_name: "Central Sector Scheme of Scholarships for College Students",
            category_name: "Central Government Scholarships",
            benefits: "₹12,000 per annum for graduation studies",
            min_gpa: 7.5,
            max_income: 450000,
            income_label: "₹4.5 Lakhs",
            caste_quota: "Top 20th Percentile (All Categories)",
            eligible_departments: "CSE, ECE, EEE, IT, MECH, CIVIL",
            eligible_years: "1, 2, 3, 4",
            documents: ["12th Marksheet", "Income Certificate", "Bonafide Student Certificate", "Aadhaar Linked Bank Passbook"]
        },
        {
            id: 2,
            categoryId: 2,
            scholarship_name: "Post-Matric Scholarship Scheme for SC/ST Students",
            category_name: "Category Based Scholarships",
            benefits: "100% Tuition Fee Waiver + Monthly Maintenance Allowance",
            min_gpa: 6.0,
            max_income: 250000,
            income_label: "₹2.5 Lakhs",
            caste_quota: "Scheduled Caste (SC) / Scheduled Tribe (ST)",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Community Certificate (SC/ST)", "Income Certificate (Tehsildar)", "Previous Year Marksheets", "Institute Bonafide"]
        },
        {
            id: 3,
            categoryId: 3,
            scholarship_name: "AICTE Pragati Scholarship for Girl Students",
            category_name: "AICTE Scholarships",
            benefits: "₹50,000 per annum for technical education",
            min_gpa: 7.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "Girl Students in Technical Degrees",
            eligible_departments: "CSE, ECE, EEE, IT, MECH, CIVIL",
            eligible_years: "1, 2, 3, 4",
            documents: ["AICTE Allotment Letter", "Family Income Certificate", "Aadhaar Linked Bank Passbook", "Institute Verification"]
        },
        {
            id: 4,
            categoryId: 4,
            scholarship_name: "State Higher Education Tuition Fee Reimbursement Scheme",
            category_name: "State Government Scholarships",
            benefits: "100% Tuition Fee Reimbursement",
            min_gpa: 7.0,
            max_income: 300000,
            income_label: "₹3.0 Lakhs",
            caste_quota: "State Domicile Students",
            eligible_departments: "ALL ENGINEERING DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Domicile Certificate", "College Allotment Order", "Income Certificate", "Fee Receipts"]
        },
        {
            id: 5,
            categoryId: 5,
            scholarship_name: "Sona Gold Medal Merit Scholarship",
            category_name: "Merit Based Scholarships",
            benefits: "Full Tuition Waiver + Free Laptop Allowance",
            min_gpa: 8.5,
            max_income: 400000,
            income_label: "₹4.0 Lakhs",
            caste_quota: "Merit Rankers (Top 5%)",
            eligible_departments: "CSE, ECE, IT",
            eligible_years: "2, 3, 4",
            documents: ["Semester Marksheets (CGPA ≥ 8.5)", "Bonafide Student Certificate", "Aadhaar Card", "Bank Passbook Copy"]
        },
        {
            id: 6,
            categoryId: 6,
            scholarship_name: "Financial Hardship Education Relief Fund",
            category_name: "Need Based Scholarships",
            benefits: "₹35,000 Emergency Fee Assistance",
            min_gpa: 6.5,
            max_income: 150000,
            income_label: "₹1.5 Lakhs",
            caste_quota: "Low Income Families",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Income Certificate", "Family Situation Declaration", "College Fee Statement", "Aadhaar Card"]
        },
        {
            id: 7,
            categoryId: 7,
            scholarship_name: "Sona Women Empowerment Foundation Aid",
            category_name: "Scholarships for Girls",
            benefits: "100% Free Hostel Accommodation & Bus Transport",
            min_gpa: 8.0,
            max_income: 400000,
            income_label: "₹4.0 Lakhs",
            caste_quota: "Female Undergraduates",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Academic Transcripts", "Income Certificate", "Residential Proof", "HOD Recommendation"]
        },
        {
            id: 8,
            categoryId: 8,
            scholarship_name: "National PwD Empowerment Fellowship",
            category_name: "Scholarships for Students with Disabilities (PwD)",
            benefits: "₹45,000 Annual Stipend + Assistive Book Allowance",
            min_gpa: 5.5,
            max_income: 600000,
            income_label: "₹6.0 Lakhs",
            caste_quota: "PwD Category (Disability ≥ 40%)",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Disability Certificate (Medical Board)", "Bonafide Certificate", "Bank Passbook Copy", "Aadhaar Card"]
        },
        {
            id: 9,
            categoryId: 9,
            scholarship_name: "College Founder's Memorial Trust Grant",
            category_name: "Institutional Scholarships",
            benefits: "₹25,000 Annual Institutional Scholarship",
            min_gpa: 7.5,
            max_income: 350000,
            income_label: "₹3.5 Lakhs",
            caste_quota: "All Registered Students",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["College ID", "Semester Marksheet", "Income Certificate", "Faculty Recommendation"]
        },
        {
            id: 10,
            categoryId: 10,
            scholarship_name: "State & National Sports Champion Fee Waiver",
            category_name: "Sports Scholarships",
            benefits: "100% Sports Fee Waiver + Free Sports Kit",
            min_gpa: 6.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "State / National Level Athletes",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Sports Achievement Certificates (Form 1/2/3)", "Physical Fitness Certificate", "Academic Marksheet", "College ID"]
        },
        {
            id: 11,
            categoryId: 11,
            scholarship_name: "Student R&D Patent & Innovation Grant",
            category_name: "Research and Innovation Scholarships",
            benefits: "₹50,000 Project & Patent Filing Subsidy",
            min_gpa: 8.0,
            max_income: 1000000,
            income_label: "₹10.0 Lakhs",
            caste_quota: "UG Student Researchers",
            eligible_departments: "CSE, ECE, MECH, IT",
            eligible_years: "3, 4",
            documents: ["Project Proposal / Abstract", "Faculty Guide Endorsement", "Academic Transcripts", "Bank Account Details"]
        },
        {
            id: 12,
            categoryId: 12,
            scholarship_name: "Global Student Exchange & Immersion Scholarship",
            category_name: "International Scholarships for Indian UG Students",
            benefits: "₹1,50,000 Travel & Foreign Living Stipend",
            min_gpa: 8.5,
            max_income: 1200000,
            income_label: "₹12.0 Lakhs",
            caste_quota: "UG Students (Semester 5-7)",
            eligible_departments: "CSE, ECE, IT",
            eligible_years: "3, 4",
            documents: ["Foreign Partner Acceptance", "Valid Passport", "Academic Transcripts (CGPA ≥ 8.5)", "Statement of Purpose"]
        },
        {
            id: 13,
            categoryId: 13,
            scholarship_name: "Tech Corp CSR Women in Engineering Scholarship",
            category_name: "Corporate Scholarships",
            benefits: "₹75,000 per year + Direct Corporate Internship",
            min_gpa: 7.5,
            max_income: 500000,
            income_label: "₹5.0 Lakhs",
            caste_quota: "Female CS / IT Engineering Students",
            eligible_departments: "CSE, IT, ECE",
            eligible_years: "2, 3, 4",
            documents: ["10th/12th/UG Marksheets", "Income Certificate", "Resume / CV", "Bonafide Certificate"]
        },
        {
            id: 14,
            categoryId: 14,
            scholarship_name: "Central Scheme to Provide Interest Subsidy (CSIS) on Education Loans",
            category_name: "Education Loan Interest Subsidy Schemes",
            benefits: "100% Moratorium Interest Subsidy on Bank Education Loans",
            min_gpa: 6.0,
            max_income: 450000,
            income_label: "₹4.5 Lakhs",
            caste_quota: "Bank Loan Borrowers",
            eligible_departments: "ALL DEPARTMENTS",
            eligible_years: "1, 2, 3, 4",
            documents: ["Bank Education Loan Sanction Letter", "Tehsildar Income Certificate", "Bonafide Certificate", "Aadhaar Card"]
        }
    ]);

    const [selectedCatFilter, setSelectedCatFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [editModalItem, setEditModalItem] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Document checklist editing state in Modal
    const [docInputText, setDocInputText] = useState("");

    const handleEditOpen = (sch) => {
        setEditModalItem({
            ...sch,
            documents: [...sch.documents]
        });
        setDocInputText("");
    };

    const handleAddDocumentItem = () => {
        if (!docInputText.trim() || !editModalItem) return;
        setEditModalItem({
            ...editModalItem,
            documents: [...editModalItem.documents, docInputText.trim()]
        });
        setDocInputText("");
    };

    const handleRemoveDocumentItem = (index) => {
        if (!editModalItem) return;
        const updated = editModalItem.documents.filter((_, i) => i !== index);
        setEditModalItem({
            ...editModalItem,
            documents: updated
        });
    };

    const handleSaveEditSubmit = (e) => {
        e.preventDefault();
        if (!editModalItem) return;

        setScholarships(prev => prev.map(s => s.id === editModalItem.id ? editModalItem : s));
        setEditModalItem(null);

        setToastMessage(`Successfully updated criteria & documents for "${editModalItem.scholarship_name}"!`);
        setTimeout(() => setToastMessage(""), 4000);
    };

    const handleDeleteScheme = (id, name) => {
        if (confirm(`Are you sure you want to delete scholarship scheme "${name}"?`)) {
            setScholarships(prev => prev.filter(s => s.id !== id));
            setToastMessage(`Deleted scheme "${name}".`);
            setTimeout(() => setToastMessage(""), 4000);
        }
    };

    const filteredScholarships = scholarships.filter(s => {
        const matchesCat = selectedCatFilter === "All" || s.categoryId === parseInt(selectedCatFilter);
        const matchesQuery = !searchQuery || 
            s.scholarship_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>⚙ Admin Scholarship Management & Eligibility Configurator</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    14 Scholarship Schemes & Criteria Configuration
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    Manage eligibility thresholds, Min CGPA requirements, Max family income limits, eligible departments, quota rules, and required document checklists for all 14 graduation scholarship programs.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge success">{scholarships.length} Schemes Active</span>
                    <span className="badge">14 Categories Configured</span>
                </div>
            </section>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    ✓ {toastMessage}
                </div>
            )}

            {/* SEARCH & CATEGORY FILTER TOOLBAR */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search scholarship by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select
                    className="input"
                    value={selectedCatFilter}
                    onChange={(e) => setSelectedCatFilter(e.target.value)}
                    style={{ width: 'auto', background: '#081229', color: '#fff' }}
                >
                    <option value="All">All 14 Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>Category #{cat.id}: {cat.name}</option>
                    ))}
                </select>
            </div>

            {/* SCHOLARSHIP SCHEMES DATA ROWS */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Configured Scholarship Schemes ({filteredScholarships.length})</div>
                        <div className="panel-subtitle">Manage criteria, income limits, and document checklists</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredScholarships.map((sch) => (
                        <div key={sch.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                                <div className="data-icon" style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#a855f7' }}>
                                    🎓
                                </div>
                                <div>
                                    <div className="data-title" style={{ fontSize: '15px', color: '#ffffff' }}>{sch.scholarship_name}</div>
                                    <div className="data-meta" style={{ marginTop: '4px' }}>
                                        <span className="badge" style={{ background: 'var(--primary-soft)', color: '#ffffff' }}>Cat #{sch.categoryId}: {sch.category_name}</span>
                                        <span className="badge">Min CGPA: {sch.min_gpa}</span>
                                        <span className="badge">Max Income: {sch.income_label || `₹${(sch.max_income/100000).toFixed(1)}L`}</span>
                                        <span className="badge">Quota: {sch.caste_quota}</span>
                                        <span className="badge success">{sch.documents.length} Docs Required</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button className="button primary" onClick={() => handleEditOpen(sch)}>
                                    ⚙ Edit Criteria & Documents
                                </button>
                                <button className="button danger" onClick={() => handleDeleteScheme(sch.id, sch.scholarship_name)}>
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* EDIT CRITERIA & DOCUMENTS MODAL */}
            {editModalItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '680px', width: '100%', padding: '28px', background: '#0a142b', border: '1px solid var(--border-hover)', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span className="badge warning" style={{ marginBottom: '6px' }}>Edit Criteria & Documents</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{editModalItem.scholarship_name}</h3>
                            </div>
                            <button className="button danger" onClick={() => setEditModalItem(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <form onSubmit={handleSaveEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* SCHOLARSHIP NAME & BENEFIT */}
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Scholarship Program Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editModalItem.scholarship_name}
                                    onChange={(e) => setEditModalItem({ ...editModalItem, scholarship_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Financial Coverage & Benefits</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editModalItem.benefits}
                                    onChange={(e) => setEditModalItem({ ...editModalItem, benefits: e.target.value })}
                                    required
                                />
                            </div>

                            {/* CRITERIA GRID */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Minimum CGPA Cutoff</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="input"
                                        value={editModalItem.min_gpa}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, min_gpa: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Maximum Family Income (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={editModalItem.max_income}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, max_income: parseInt(e.target.value), income_label: `₹${(parseInt(e.target.value)/100000).toFixed(1)} Lakhs` })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Quota / Category</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editModalItem.caste_quota}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, caste_quota: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Eligible Departments</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editModalItem.eligible_departments}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, eligible_departments: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* REQUIRED DOCUMENTS CHECKLIST EDITOR */}
                            <div style={{ background: '#081229', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                                    REQUIRED DOCUMENTS CHECKLIST ({editModalItem.documents.length})
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                    {editModalItem.documents.map((doc, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0a142b', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <span style={{ fontSize: '12px', color: '#ffffff' }}>✓ {doc}</span>
                                            <button
                                                type="button"
                                                className="button danger"
                                                onClick={() => handleRemoveDocumentItem(idx)}
                                                style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Add required document name (e.g. Bonafide Letter)"
                                        value={docInputText}
                                        onChange={(e) => setDocInputText(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" className="button primary" onClick={handleAddDocumentItem}>
                                        + Add Doc
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" className="button" onClick={() => setEditModalItem(null)}>Cancel</button>
                                <button type="submit" className="button primary">Save Criteria & Documents</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Criteria edits update student dashboard eligibility checks and AI chatbot knowledge base instantly.
            </div>
        </div>
    );
}
