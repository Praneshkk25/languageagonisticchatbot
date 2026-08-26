"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";

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

    const defaultScholarships = [
        {
            id: "central_sector_scheme",
            categoryId: 1,
            scholarship_name: "Central Sector Scheme of Scholarships for College Students",
            category_name: "Central Government Scholarships",
            provider_organization: "Ministry of Education, Govt. of India",
            benefits: "₹12,000 per annum for graduation studies",
            min_gpa: 7.5,
            max_income: 450000,
            income_label: "₹4.5 Lakhs",
            caste_quota: "Top 20th Percentile (All Categories)",
            eligible_departments: ["CSE", "ECE", "EEE", "IT", "MECH", "CIVIL"],
            eligible_years: [1, 2, 3, 4],
            application_mode: "Online",
            hardcopy_venue: "College Scholarship Cell, Room #102",
            hardcopy_instructions: "Submit attested physical photocopies within 7 days.",
            application_portal: "https://scholarships.gov.in",
            documents: ["12th Marksheet", "Income Certificate", "Bonafide Student Certificate", "Aadhaar Linked Bank Passbook"]
        },
        {
            id: "post_matric_sc_st",
            categoryId: 2,
            scholarship_name: "Post-Matric Scholarship Scheme for SC/ST Students",
            category_name: "Category Based Scholarships",
            provider_organization: "Ministry of Social Justice & Empowerment",
            benefits: "100% Tuition Fee Waiver + Monthly Maintenance Allowance",
            min_gpa: 6.0,
            max_income: 250000,
            income_label: "₹2.5 Lakhs",
            caste_quota: "Scheduled Caste (SC) / Scheduled Tribe (ST)",
            eligible_departments: ["ALL"],
            eligible_years: [1, 2, 3, 4],
            application_mode: "Hybrid",
            hardcopy_venue: "Scholarship Cell, Admin Block Room 102",
            hardcopy_instructions: "Submit original community and income certificates for verification.",
            application_portal: "https://scholarships.gov.in",
            documents: ["Community Certificate (SC/ST)", "Income Certificate (Tehsildar)", "Previous Year Marksheets", "Institute Bonafide"]
        },
        {
            id: "aicte_pragati",
            categoryId: 3,
            scholarship_name: "AICTE Pragati Scholarship for Girl Students",
            category_name: "AICTE Scholarships",
            provider_organization: "All India Council for Technical Education (AICTE)",
            benefits: "₹50,000 per annum for technical education",
            min_gpa: 7.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "Girl Students in Technical Degrees",
            eligible_departments: ["CSE", "ECE", "EEE", "IT", "MECH", "CIVIL"],
            eligible_years: [1, 2, 3, 4],
            application_mode: "Online",
            hardcopy_venue: "College Scholarship Cell, Room #102",
            hardcopy_instructions: "Online verification on AICTE portal.",
            application_portal: "https://www.aicte-pragati-saksham-gov.in",
            documents: ["AICTE Allotment Letter", "Family Income Certificate", "Aadhaar Linked Bank Passbook", "Institute Verification"]
        },
        {
            id: "state_sports_merit_scholarship",
            categoryId: 10,
            scholarship_name: "State & National Sports Champion Fee Waiver",
            category_name: "Sports Scholarships",
            provider_organization: "Sports Development Authority & Institutional Trust",
            benefits: "100% Sports Fee Waiver + Free Sports Kit",
            min_gpa: 6.0,
            max_income: 800000,
            income_label: "₹8.0 Lakhs",
            caste_quota: "State / National Level Athletes",
            eligible_departments: ["ALL"],
            eligible_years: [1, 2, 3, 4],
            application_mode: "Hybrid",
            hardcopy_venue: "Physical Education Dept & Scholarship Cell (Room 102)",
            hardcopy_instructions: "Submit original sports achievement certificates (Form 1/2/3) and medical fitness certificate.",
            application_portal: "https://scholarships.gov.in",
            documents: ["Sports Achievement Certificates (Form 1/2/3)", "Physical Fitness Certificate", "Academic Marksheet", "College ID"]
        }
    ];

    const ALL_DEPARTMENTS = [
        { code: "CSE", name: "CSE (Computer Science & Engg)" },
        { code: "IT", name: "IT (Information Technology)" },
        { code: "AIDS", name: "AI & Data Science (AI-DS)" },
        { code: "ECE", name: "ECE (Electronics & Comm)" },
        { code: "EEE", name: "EEE (Electrical & Electronics)" },
        { code: "MECH", name: "MECH (Mechanical & Safety)" },
        { code: "MCT", name: "MCT (Mechatronics Engineering)" },
        { code: "CIVIL", name: "CIVIL (Civil Engineering)" },
        { code: "BME", name: "BME (Biomedical Engineering)" },
        { code: "FT", name: "FT (Fashion Technology)" },
        { code: "MBA", name: "MBA (Management Studies)" },
        { code: "MCA", name: "MCA (Computer Applications)" }
    ];

    const STANDARD_DOC_PRESETS = [
        "Aadhaar Card",
        "Annual Income Certificate",
        "Academic Marksheet (10th/12th/Sem)",
        "Bonafide Student Certificate",
        "Community / Caste Certificate",
        "Aadhaar Linked Bank Passbook",
        "College Tuition Fee Receipt",
        "Nativity / Domicile Certificate",
        "First Graduate Certificate",
        "Disability Certificate (PwD)",
        "Sports / Extracurricular Proof"
    ];

    const [scholarships, setScholarships] = useState(defaultScholarships);
    const [selectedCatFilter, setSelectedCatFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [toastMessage, setToastMessage] = useState("");

    // Edit Modal State
    const [editModalItem, setEditModalItem] = useState(null);
    const [docInputText, setDocInputText] = useState("");

    // Create Scholarship Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createDocInput, setCreateDocInput] = useState("");
    const [newScholarship, setNewScholarship] = useState({
        scholarship_name: "",
        categoryId: 1,
        category_name: "Central Government Scholarships",
        provider_organization: "Ministry of Education / State Dept",
        benefits: "₹50,000 per annum + Academic Subsidy",
        min_gpa: 7.0,
        max_income: 450000,
        income_label: "₹4.5 Lakhs",
        caste_quota: "All Categories",
        eligible_departments: ["CSE", "IT", "AIDS", "ECE", "EEE", "MECH", "MCT", "CIVIL", "BME", "FT", "MBA", "MCA"],
        eligible_years: [1, 2, 3, 4],
        degree_level: "All Levels (UG/PG/PhD)",
        application_mode: "Online",
        hardcopy_venue: "College Scholarship Cell, Room #102",
        hardcopy_instructions: "Submit attested physical photocopies within 7 days of online application.",
        application_portal: "https://scholarships.gov.in",
        renewal_eligibility: "Annual renewal upon minimum 50% passing marks",
        backlog_restrictions: "No standing backlogs permitted for fresh awards",
        important_dates: { closing_date: "30th November 2026" },
        documents: ["Aadhaar Card", "Annual Income Certificate", "Academic Marksheet (10th/12th/Sem)", "Bonafide Student Certificate"]
    });

    useEffect(() => {
        fetchScholarships();
    }, []);

    const fetchScholarships = async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/scholarships/all`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const normalized = data.map(item => ({
                        ...item,
                        documents: Array.isArray(item.documents) ? item.documents : (Array.isArray(item.required_documents) ? item.required_documents : [])
                    }));
                    setScholarships(normalized);
                }
            }
        } catch (e) {
            console.error("Error fetching scholarships:", e);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 5000);
    };

    // Open Edit Modal
    const handleEditOpen = (sch) => {
        const docs = Array.isArray(sch.documents) ? [...sch.documents] : (Array.isArray(sch.required_documents) ? [...sch.required_documents] : []);
        setEditModalItem({
            ...sch,
            eligible_departments: sch.eligible_departments || ["CSE", "IT", "AIDS", "ECE", "EEE", "MECH", "MCT", "CIVIL", "BME", "FT", "MBA", "MCA"],
            eligible_years: sch.eligible_years || [1, 2, 3, 4],
            degree_level: sch.degree_level || "All Levels (UG/PG/PhD)",
            application_portal: sch.application_portal || "https://scholarships.gov.in",
            documents: docs
        });
        setDocInputText("");
    };

    const handleAddDocumentItem = () => {
        if (!docInputText.trim() || !editModalItem) return;
        const currentDocs = Array.isArray(editModalItem.documents) ? editModalItem.documents : [];
        if (!currentDocs.includes(docInputText.trim())) {
            setEditModalItem({
                ...editModalItem,
                documents: [...currentDocs, docInputText.trim()]
            });
        }
        setDocInputText("");
    };

    const handleRemoveDocumentItem = (index) => {
        if (!editModalItem) return;
        const currentDocs = Array.isArray(editModalItem.documents) ? editModalItem.documents : [];
        const updated = currentDocs.filter((_, i) => i !== index);
        setEditModalItem({
            ...editModalItem,
            documents: updated
        });
    };

    // Department & Year toggle helpers for Create Modal
    const handleToggleDeptCreate = (deptCode) => {
        const current = newScholarship.eligible_departments || [];
        if (current.includes(deptCode)) {
            setNewScholarship(prev => ({
                ...prev,
                eligible_departments: current.filter(d => d !== deptCode)
            }));
        } else {
            setNewScholarship(prev => ({
                ...prev,
                eligible_departments: [...current, deptCode]
            }));
        }
    };

    const handleSelectAllDeptsCreate = () => {
        const allCodes = ALL_DEPARTMENTS.map(d => d.code);
        const current = newScholarship.eligible_departments || [];
        if (current.length === allCodes.length) {
            setNewScholarship(prev => ({ ...prev, eligible_departments: [] }));
        } else {
            setNewScholarship(prev => ({ ...prev, eligible_departments: allCodes }));
        }
    };

    const handleToggleYearCreate = (yearNum) => {
        const current = newScholarship.eligible_years || [1, 2, 3, 4];
        if (current.includes(yearNum)) {
            setNewScholarship(prev => ({
                ...prev,
                eligible_years: current.filter(y => y !== yearNum)
            }));
        } else {
            setNewScholarship(prev => ({
                ...prev,
                eligible_years: [...current, yearNum].sort()
            }));
        }
    };

    const handleQuickAddDocCreate = (docName) => {
        const current = newScholarship.documents || [];
        if (!current.includes(docName)) {
            setNewScholarship(prev => ({
                ...prev,
                documents: [...current, docName]
            }));
        }
    };

    const handleAddAllMandatoryDocsCreate = () => {
        const mandatory = ["Aadhaar Card", "Annual Income Certificate", "Academic Marksheet (10th/12th/Sem)", "Bonafide Student Certificate"];
        const current = newScholarship.documents || [];
        const combined = Array.from(new Set([...current, ...mandatory]));
        setNewScholarship(prev => ({ ...prev, documents: combined }));
    };

    // Department & Year toggle helpers for Edit Modal
    const handleToggleDeptEdit = (deptCode) => {
        if (!editModalItem) return;
        const current = editModalItem.eligible_departments || [];
        if (current.includes(deptCode)) {
            setEditModalItem(prev => ({
                ...prev,
                eligible_departments: current.filter(d => d !== deptCode)
            }));
        } else {
            setEditModalItem(prev => ({
                ...prev,
                eligible_departments: [...current, deptCode]
            }));
        }
    };

    const handleSelectAllDeptsEdit = () => {
        if (!editModalItem) return;
        const allCodes = ALL_DEPARTMENTS.map(d => d.code);
        const current = editModalItem.eligible_departments || [];
        if (current.length === allCodes.length) {
            setEditModalItem(prev => ({ ...prev, eligible_departments: [] }));
        } else {
            setEditModalItem(prev => ({ ...prev, eligible_departments: allCodes }));
        }
    };

    const handleToggleYearEdit = (yearNum) => {
        if (!editModalItem) return;
        const current = editModalItem.eligible_years || [1, 2, 3, 4];
        if (current.includes(yearNum)) {
            setEditModalItem(prev => ({
                ...prev,
                eligible_years: current.filter(y => y !== yearNum)
            }));
        } else {
            setEditModalItem(prev => ({
                ...prev,
                eligible_years: [...current, yearNum].sort()
            }));
        }
    };

    const handleQuickAddDocEdit = (docName) => {
        if (!editModalItem) return;
        const current = editModalItem.documents || [];
        if (!current.includes(docName)) {
            setEditModalItem(prev => ({
                ...prev,
                documents: [...current, docName]
            }));
        }
    };

    const handleAddAllMandatoryDocsEdit = () => {
        if (!editModalItem) return;
        const mandatory = ["Aadhaar Card", "Annual Income Certificate", "Academic Marksheet (10th/12th/Sem)", "Bonafide Student Certificate"];
        const current = editModalItem.documents || [];
        const combined = Array.from(new Set([...current, ...mandatory]));
        setEditModalItem(prev => ({ ...prev, documents: combined }));
    };

    // Save Edit Submit
    const handleSaveEditSubmit = async (e) => {
        e.preventDefault();
        if (!editModalItem) return;

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/scholarships/${editModalItem.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editModalItem)
            });

            if (res.ok) {
                setScholarships(prev => prev.map(s => s.id === editModalItem.id ? editModalItem : s));
                setEditModalItem(null);
                showToast(`Successfully updated criteria for "${editModalItem.scholarship_name}"!`);
                fetchScholarships();
            } else {
                alert("Failed to update scholarship in database.");
            }
        } catch (err) {
            console.error("Update error:", err);
            setScholarships(prev => prev.map(s => s.id === editModalItem.id ? editModalItem : s));
            setEditModalItem(null);
            showToast(`Updated "${editModalItem.scholarship_name}" locally.`);
        }
    };

    // Create Scholarship Handler
    const handleCreateScholarshipSubmit = async (e) => {
        e.preventDefault();
        if (!newScholarship.scholarship_name.trim()) {
            alert("Please enter scholarship title.");
            return;
        }

        const catObj = categories.find(c => c.id === parseInt(newScholarship.categoryId)) || categories[0];
        const docId = newScholarship.scholarship_name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString().slice(-4);
        
        const payload = {
            ...newScholarship,
            id: docId,
            category_id: parseInt(newScholarship.categoryId),
            categoryId: parseInt(newScholarship.categoryId),
            category_name: catObj.name,
            income_label: `₹${(newScholarship.max_income / 100000).toFixed(1)} Lakhs`
        };

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/scholarships`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setScholarships(prev => [payload, ...prev]);
                setCreateModalOpen(false);
                showToast(`✓ New scholarship scheme "${payload.scholarship_name}" published! Broadcast email notification dispatched to all registered students.`);
                fetchScholarships();
            } else {
                alert("Failed to save scholarship to backend server.");
            }
        } catch (err) {
            console.error("Creation error:", err);
            setScholarships(prev => [payload, ...prev]);
            setCreateModalOpen(false);
            showToast(`✓ Created "${payload.scholarship_name}"!`);
        }
    };

    const handleCreateAddDoc = () => {
        if (!createDocInput.trim()) return;
        const current = newScholarship.documents || [];
        if (!current.includes(createDocInput.trim())) {
            setNewScholarship(prev => ({
                ...prev,
                documents: [...current, createDocInput.trim()]
            }));
        }
        setCreateDocInput("");
    };

    const handleCreateRemoveDoc = (index) => {
        setNewScholarship(prev => ({
            ...prev,
            documents: (prev.documents || []).filter((_, i) => i !== index)
        }));
    };

    const handleDeleteScheme = async (id, name) => {
        if (!confirm(`Are you sure you want to permanently delete scholarship scheme "${name}"?`)) return;
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/scholarships/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setScholarships(prev => prev.filter(s => s.id !== id));
                showToast(`Deleted scheme "${name}".`);
            } else {
                alert("Failed to delete scholarship.");
            }
        } catch (e) {
            console.error("Delete error:", e);
            setScholarships(prev => prev.filter(s => s.id !== id));
            showToast(`Deleted scheme "${name}".`);
        }
    };

    const filteredScholarships = scholarships.filter(s => {
        if (!s) return false;
        const matchesCat = selectedCatFilter === "All" || s.categoryId === parseInt(selectedCatFilter) || s.category_id === parseInt(selectedCatFilter);
        const name = (s.scholarship_name || s.name || "").toLowerCase();
        const catName = (s.category_name || "").toLowerCase();
        const q = (searchQuery || "").toLowerCase();
        const matchesQuery = !q || name.includes(q) || catName.includes(q);
        return matchesCat && matchesQuery;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>⚙ Admin Scholarship Management & Eligibility Configurator</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    Scholarship Schemes & Criteria Configuration
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    Configure scholarship schemes, define eligibility thresholds (CGPA, Income limits, Quotas, Eligible Departments), specify document requirements, and set Online / Offline / Hybrid hardcopy submission rules.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge success">{scholarships.length} Schemes Active</span>
                    <span className="badge">14 Categories Configured</span>
                    <button 
                        className="button primary" 
                        onClick={() => setCreateModalOpen(true)}
                        style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', fontWeight: 800, padding: '8px 18px', fontSize: '13px' }}
                    >
                        + Add New Scholarship Scheme
                    </button>
                </div>
            </section>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    {toastMessage}
                </div>
            )}

            {/* SEARCH & CATEGORY FILTER TOOLBAR */}
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
                    <div className="search toolbar-search" style={{ flex: 1 }}>
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
                        style={{ width: 'auto' }}
                    >
                        <option value="All">All 14 Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>Category #{cat.id}: {cat.name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    className="button primary" 
                    onClick={() => setCreateModalOpen(true)}
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                    + Add Scholarship
                </button>
            </div>

            {/* SCHOLARSHIP SCHEMES DATA ROWS */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Configured Scholarship Schemes ({filteredScholarships.length})</div>
                        <div className="panel-subtitle">Manage criteria, submission modes, income limits, and document checklists</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredScholarships.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎓</div>
                            <div className="empty-title">No scholarship schemes found</div>
                            <div className="empty-description">Create a new scholarship scheme to make it available for student applications.</div>
                            <button className="button primary" style={{ marginTop: '14px' }} onClick={() => setCreateModalOpen(true)}>
                                + Add First Scholarship Scheme
                            </button>
                        </div>
                    ) : (
                        filteredScholarships.map((sch) => (
                            <div key={sch.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', padding: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                                    <div className="data-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: '20px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                                        🎓
                                    </div>
                                    <div>
                                        <div className="data-title" style={{ fontSize: '15.5px', color: 'var(--text)', fontWeight: 800 }}>{sch.scholarship_name}</div>
                                        <div className="data-meta" style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>Cat #{sch.categoryId || sch.category_id}: {sch.category_name}</span>
                                            <span className="badge" style={{ background: (sch.application_mode === 'Offline' ? 'rgba(168, 85, 247, 0.15)' : (sch.application_mode === 'Hybrid' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)')), color: (sch.application_mode === 'Offline' ? '#9333ea' : (sch.application_mode === 'Hybrid' ? '#d97706' : '#0284c7')) }}>
                                                {sch.application_mode === 'Offline' ? '🏛️ Offline (Hardcopy Only)' : (sch.application_mode === 'Hybrid' ? '🔄 Hybrid (Upload + Hardcopy)' : '🌐 Online Only')}
                                            </span>
                                            <span className="badge">Min CGPA: {sch.min_gpa}</span>
                                            <span className="badge">Max Income: {sch.income_label || `₹${((sch.max_income || 450000)/100000).toFixed(1)}L`}</span>
                                            <span className="badge success">{(sch.documents || sch.required_documents || []).length} Docs Required</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button className="button primary" onClick={() => handleEditOpen(sch)} style={{ fontSize: '12px' }}>
                                        ⚙ Edit Criteria & Documents
                                    </button>
                                    <button className="button danger" onClick={() => handleDeleteScheme(sch.id, sch.scholarship_name)} style={{ fontSize: '12px' }}>
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* CREATE NEW SCHOLARSHIP MODAL */}
            {createModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '780px', width: '100%', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                            <div>
                                <span className="badge success" style={{ marginBottom: '6px' }}>+ New Scholarship Creator</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Add New Scholarship Scheme</h3>
                            </div>
                            <button className="button danger" onClick={() => setCreateModalOpen(false)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <form onSubmit={handleCreateScholarshipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* SCHOLARSHIP TITLE & CATEGORY */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Scholarship Program Title *
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. National Merit Fellowship for Undergraduates"
                                        value={newScholarship.scholarship_name}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, scholarship_name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Category Scheme *
                                    </label>
                                    <select
                                        className="input"
                                        value={newScholarship.categoryId}
                                        onChange={(e) => {
                                             const cat = categories.find(c => c.id === parseInt(e.target.value));
                                             setNewScholarship({ 
                                                 ...newScholarship, 
                                                 categoryId: parseInt(e.target.value),
                                                 category_name: cat ? cat.name : "Central Government Scholarships"
                                             });
                                         }}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>#{cat.id}: {cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* PROVIDER & BENEFITS */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Provider Organization</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Ministry of Education / Corporate CSR"
                                        value={newScholarship.provider_organization}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, provider_organization: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Financial Coverage & Benefits *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. ₹50,000 per annum + Laptop allowance"
                                        value={newScholarship.benefits}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, benefits: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* ACADEMIC & FINANCIAL THRESHOLDS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Minimum CGPA</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="input"
                                        value={newScholarship.min_gpa}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, min_gpa: parseFloat(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Max Income (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={newScholarship.max_income}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, max_income: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Quota</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newScholarship.caste_quota}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, caste_quota: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Closing Date</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newScholarship.important_dates?.closing_date || '30th November 2026'}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, important_dates: { closing_date: e.target.value } })}
                                    />
                                </div>
                            </div>

                            {/* ELIGIBLE ACADEMIC DEPARTMENTS SELECTOR */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                                        🏛️ Eligible Academic Departments ({newScholarship.eligible_departments?.length || 0} Selected)
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllDeptsCreate}
                                        className="button"
                                        style={{ fontSize: '11px', padding: '3px 8px', height: 'auto' }}
                                    >
                                        {(newScholarship.eligible_departments?.length === ALL_DEPARTMENTS.length) ? "Clear All" : "⚡ Select All Departments"}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {ALL_DEPARTMENTS.map(d => {
                                        const isSelected = (newScholarship.eligible_departments || []).includes(d.code);
                                        return (
                                            <button
                                                key={d.code}
                                                type="button"
                                                onClick={() => handleToggleDeptCreate(d.code)}
                                                style={{
                                                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--surface)',
                                                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    borderRadius: '8px',
                                                    padding: '5px 10px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <span>{isSelected ? "✓" : "+"}</span>
                                                <span>{d.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ELIGIBLE ACADEMIC YEARS, DEGREE LEVEL & APPLICATION PORTAL */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                                    🎓 Academic Years, Degree Level & Portal Link
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                            Eligible Study Years
                                        </label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {[1, 2, 3, 4].map(y => {
                                                const isSel = (newScholarship.eligible_years || []).includes(y);
                                                return (
                                                    <button
                                                        key={y}
                                                        type="button"
                                                        onClick={() => handleToggleYearCreate(y)}
                                                        style={{
                                                            flex: 1,
                                                            background: isSel ? 'var(--primary)' : 'var(--surface)',
                                                            color: isSel ? '#ffffff' : 'var(--text-secondary)',
                                                            border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                            borderRadius: '6px',
                                                            padding: '6px 0',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Year {y}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Degree Level Allowed
                                        </label>
                                        <select
                                            className="input"
                                            value={newScholarship.degree_level || "All Levels (UG/PG/PhD)"}
                                            onChange={(e) => setNewScholarship({ ...newScholarship, degree_level: e.target.value })}
                                        >
                                            <option value="All Levels (UG/PG/PhD)">All Levels (UG + PG + Ph.D)</option>
                                            <option value="Undergraduate Only (B.E. / B.Tech)">Undergraduate (B.E. / B.Tech)</option>
                                            <option value="Postgraduate Only (M.E. / M.Tech / MBA / MCA)">Postgraduate (M.E. / M.Tech / MBA / MCA)</option>
                                            <option value="Doctoral Only (Ph.D)">Doctoral (Ph.D)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Official Application Portal Link / Website URL
                                    </label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://scholarships.gov.in or https://www.sonatech.ac.in"
                                        value={newScholarship.application_portal || ''}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, application_portal: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* SUBMISSION MODE: ONLINE / OFFLINE / HYBRID */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                                    🏛️ Application & Document Submission Mode
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Submission Mode *
                                        </label>
                                        <select
                                            className="input"
                                            value={newScholarship.application_mode}
                                            onChange={(e) => setNewScholarship({ ...newScholarship, application_mode: e.target.value })}
                                        >
                                            <option value="Online">🌐 Online Submission (Digital Only)</option>
                                            <option value="Offline">🏛️ Offline Submission (Hardcopy / Physical Only)</option>
                                            <option value="Hybrid">🔄 Hybrid Submission (Online Upload + Hardcopy Verification)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Hardcopy Submission Venue
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={newScholarship.hardcopy_venue}
                                            onChange={(e) => setNewScholarship({ ...newScholarship, hardcopy_venue: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Physical Submission Instructions for Student
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newScholarship.hardcopy_instructions}
                                        onChange={(e) => setNewScholarship({ ...newScholarship, hardcopy_instructions: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* REQUIRED DOCUMENTS BUILDER & 1-CLICK PRESETS */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                                        📄 Required Document Checklist ({(newScholarship.documents || []).length} Items)
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddAllMandatoryDocsCreate}
                                        className="button"
                                        style={{ fontSize: '11px', padding: '3px 10px', height: 'auto', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}
                                    >
                                        ⚡ Add All 4 Mandatory Documents
                                    </button>
                                </div>

                                {/* QUICK DOCUMENT PRESET CHIPS */}
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Quick 1-Click Document Presets:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {STANDARD_DOC_PRESETS.map((preset, idx) => {
                                            const isAdded = (newScholarship.documents || []).includes(preset);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={isAdded}
                                                    onClick={() => handleQuickAddDocCreate(preset)}
                                                    style={{
                                                        background: isAdded ? 'var(--surface)' : 'var(--input-bg)',
                                                        border: isAdded ? '1px dashed var(--border)' : '1px solid var(--border)',
                                                        color: isAdded ? 'var(--text-muted)' : 'var(--text)',
                                                        opacity: isAdded ? 0.6 : 1,
                                                        fontSize: '11px',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        cursor: isAdded ? 'default' : 'pointer'
                                                    }}
                                                >
                                                    {isAdded ? "✓ " : "+ "}{preset}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Add custom required document..."
                                        value={createDocInput}
                                        onChange={(e) => setCreateDocInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateAddDoc(); } }}
                                    />
                                    <button type="button" className="button primary" onClick={handleCreateAddDoc}>
                                        + Add Doc
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {(newScholarship.documents || []).map((doc, idx) => (
                                        <span key={idx} className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            ✓ {doc}
                                            <button 
                                                type="button" 
                                                onClick={() => handleCreateRemoveDoc(idx)}
                                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 800, fontSize: '12px' }}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* MODAL ACTIONS */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                                <button type="button" className="button secondary" onClick={() => setCreateModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="button success" style={{ background: '#10b981', color: '#fff', fontWeight: 800, padding: '8px 20px' }}>
                                    ✓ Create & Publish Scheme →
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT CRITERIA & DOCUMENTS MODAL */}
            {editModalItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '780px', width: '100%', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                            <div>
                                <span className="badge warning" style={{ marginBottom: '6px' }}>Edit Criteria & Documents</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{editModalItem.scholarship_name}</h3>
                            </div>
                            <button className="button danger" onClick={() => setEditModalItem(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <form onSubmit={handleSaveEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Provider Organization</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editModalItem.provider_organization || 'Ministry of Education, Govt. of India'}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, provider_organization: e.target.value })}
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
                            </div>

                            {/* ACADEMIC & FINANCIAL CRITERIA */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
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
                                        value={editModalItem.caste_quota || editModalItem.caste_category || 'All Categories'}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, caste_quota: e.target.value, caste_category: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Application Closing Date</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editModalItem.important_dates?.closing_date || '30th November 2026'}
                                        onChange={(e) => setEditModalItem({ 
                                            ...editModalItem, 
                                            important_dates: { ...(editModalItem.important_dates || {}), closing_date: e.target.value } 
                                        })}
                                    />
                                </div>
                            </div>

                            {/* ELIGIBLE ACADEMIC DEPARTMENTS SELECTOR */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                                        🏛️ Eligible Academic Departments ({editModalItem.eligible_departments?.length || 0} Selected)
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllDeptsEdit}
                                        className="button"
                                        style={{ fontSize: '11px', padding: '3px 8px', height: 'auto' }}
                                    >
                                        {(editModalItem.eligible_departments?.length === ALL_DEPARTMENTS.length) ? "Clear All" : "⚡ Select All Departments"}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {ALL_DEPARTMENTS.map(d => {
                                        const isSelected = (editModalItem.eligible_departments || []).includes(d.code);
                                        return (
                                            <button
                                                key={d.code}
                                                type="button"
                                                onClick={() => handleToggleDeptEdit(d.code)}
                                                style={{
                                                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--surface)',
                                                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    borderRadius: '8px',
                                                    padding: '5px 10px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <span>{isSelected ? "✓" : "+"}</span>
                                                <span>{d.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ELIGIBLE ACADEMIC YEARS, DEGREE LEVEL & PORTAL URL */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
                                    🎓 Academic Years, Degree Level & Portal Link
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                            Eligible Study Years
                                        </label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {[1, 2, 3, 4].map(y => {
                                                const isSel = (editModalItem.eligible_years || []).includes(y);
                                                return (
                                                    <button
                                                        key={y}
                                                        type="button"
                                                        onClick={() => handleToggleYearEdit(y)}
                                                        style={{
                                                            flex: 1,
                                                            background: isSel ? 'var(--primary)' : 'var(--surface)',
                                                            color: isSel ? '#ffffff' : 'var(--text-secondary)',
                                                            border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                            borderRadius: '6px',
                                                            padding: '6px 0',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Year {y}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Degree Level Allowed
                                        </label>
                                        <select
                                            className="input"
                                            value={editModalItem.degree_level || "All Levels (UG/PG/PhD)"}
                                            onChange={(e) => setEditModalItem({ ...editModalItem, degree_level: e.target.value })}
                                        >
                                            <option value="All Levels (UG/PG/PhD)">All Levels (UG + PG + Ph.D)</option>
                                            <option value="Undergraduate Only (B.E. / B.Tech)">Undergraduate (B.E. / B.Tech)</option>
                                            <option value="Postgraduate Only (M.E. / M.Tech / MBA / MCA)">Postgraduate (M.E. / M.Tech / MBA / MCA)</option>
                                            <option value="Doctoral Only (Ph.D)">Doctoral (Ph.D)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Official Application Portal Link / Website URL
                                    </label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://scholarships.gov.in or https://www.sonatech.ac.in"
                                        value={editModalItem.application_portal || ''}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, application_portal: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* SUBMISSION MODE: ONLINE / OFFLINE HARDCOPY / HYBRID */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                                    🏛️ Application & Document Submission Mode Criteria
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Submission Mode *
                                        </label>
                                        <select
                                            className="input"
                                            value={editModalItem.application_mode || "Online"}
                                            onChange={(e) => setEditModalItem({ ...editModalItem, application_mode: e.target.value })}
                                        >
                                            <option value="Online">🌐 Online Submission (Digital Only)</option>
                                            <option value="Offline">🏛️ Offline Submission (Hardcopy / Physical Only)</option>
                                            <option value="Hybrid">🔄 Hybrid Submission (Online Upload + Hardcopy Verification)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                            Hardcopy Submission Venue / Office
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="e.g. Scholarship Cell, Administrative Block Room 102"
                                            value={editModalItem.hardcopy_venue || 'College Scholarship Cell, Room #102'}
                                            onChange={(e) => setEditModalItem({ ...editModalItem, hardcopy_venue: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Hardcopy Physical Submission Instructions
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Submit 2 sets of self-attested photocopies with original certificate verification within 7 days."
                                        value={editModalItem.hardcopy_instructions || 'Submit attested physical photocopies along with original certificates for verification within 7 days of online submission.'}
                                        onChange={(e) => setEditModalItem({ ...editModalItem, hardcopy_instructions: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* REQUIRED DOCUMENTS CHECKLIST BUILDER & 1-CLICK PRESETS */}
                            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', display: 'block', margin: 0 }}>
                                        📄 Required Verification Documents ({(editModalItem.documents || []).length} Items)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddAllMandatoryDocsEdit}
                                        className="button"
                                        style={{ fontSize: '11px', padding: '3px 10px', height: 'auto', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}
                                    >
                                        ⚡ Add All 4 Mandatory Documents
                                    </button>
                                </div>

                                {/* QUICK DOCUMENT PRESET CHIPS */}
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Quick 1-Click Document Presets:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {STANDARD_DOC_PRESETS.map((preset, idx) => {
                                            const isAdded = (editModalItem.documents || []).includes(preset);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={isAdded}
                                                    onClick={() => handleQuickAddDocEdit(preset)}
                                                    style={{
                                                        background: isAdded ? 'var(--surface)' : 'var(--input-bg)',
                                                        border: isAdded ? '1px dashed var(--border)' : '1px solid var(--border)',
                                                        color: isAdded ? 'var(--text-muted)' : 'var(--text)',
                                                        opacity: isAdded ? 0.6 : 1,
                                                        fontSize: '11px',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        cursor: isAdded ? 'default' : 'pointer'
                                                    }}
                                                >
                                                    {isAdded ? "✓ " : "+ "}{preset}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Add required document name..."
                                        value={docInputText}
                                        onChange={(e) => setDocInputText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDocumentItem(); } }}
                                    />
                                    <button type="button" className="button primary" onClick={handleAddDocumentItem}>+ Add</button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(editModalItem.documents || []).map((doc, index) => (
                                        <span key={index} className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            ✓ {doc}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDocumentItem(index)}
                                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 800, fontSize: '12px' }}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                                <button type="button" className="button secondary" onClick={() => setEditModalItem(null)}>Cancel</button>
                                <button type="submit" className="button primary" style={{ padding: '8px 20px' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
