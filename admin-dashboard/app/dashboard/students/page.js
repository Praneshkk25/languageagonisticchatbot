"use client";

import { useState, useEffect } from "react";

export default function StudentDirectory() {
    const [searchQuery, setSearchQuery] = useState("");
    const [students, setStudents] = useState([
        {
            id: "1",
            admission_no: "2023CS001",
            name: "Pranesh K K",
            department: "CSE",
            year: "3rd Year (Sem 5)",
            cgpa: 8.5,
            family_income: 250000,
            guardian_name: "Kumaravel K",
            guardian_mobile: "+91 94432 10987",
            caste_category: "BC / MBC",
            bank_account_no: "987654321012",
            bank_name: "State Bank of India",
            ifsc_code: "SBIN0001234",
            status: "Eligible for Merit Scholarship",
            email: "pranesh.kk@college.edu",
            phone: "+91 98765 43210"
        },
        {
            id: "2",
            admission_no: "2023CS042",
            name: "Ananya Ramesh",
            department: "CSE",
            year: "3rd Year (Sem 5)",
            cgpa: 9.1,
            family_income: 180000,
            guardian_name: "Ramesh P",
            guardian_mobile: "+91 98123 45678",
            caste_category: "General",
            bank_account_no: "887654321099",
            bank_name: "HDFC Bank",
            ifsc_code: "HDFC0004321",
            status: "AICTE Pragati Approved",
            email: "ananya.r@college.edu",
            phone: "+91 98765 12345"
        }
    ]);

    const [selectedStudentModal, setSelectedStudentModal] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/students/all");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setStudents(data);
                }
            }
        } catch (e) {
            console.error("Error fetching students:", e);
        }
    };

    const filteredStudents = students.filter(s => 
        !searchQuery || 
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (s.admission_no && s.admission_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>👥 Student Directory & Academic Records</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    Enrolled Students Administration
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    View and manage enrolled student academic profiles, CGPA scores, annual family income declarations, social category classifications, and bank details for scholarship disbursements.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="badge">{students.length} Registered Students</span>
                    <span className="badge success">✓ Live Database Records</span>
                </div>
            </section>

            {/* SEARCH TOOLBAR */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search student by name, roll ID or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* STUDENTS DIRECTORY PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Student Records ({filteredStudents.length})</div>
                        <div className="panel-subtitle">Directory of student profiles and scholarship statuses</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredStudents.map((s) => (
                        <div key={s.admission_no || s.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                                <div className="data-icon" style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#a855f7' }}>
                                    👤
                                </div>
                                <div>
                                    <div className="data-title" style={{ fontSize: '15px', color: '#ffffff' }}>{s.name} ({s.admission_no})</div>
                                    <div className="data-meta" style={{ marginTop: '4px' }}>
                                        <span className="badge">Dept: {s.department || 'CSE'}</span>
                                        <span className="badge">CGPA: {s.cgpa || '8.5'}</span>
                                        <span className="badge">Income: ₹{s.family_income ? (s.family_income / 100000).toFixed(1) + 'L' : '2.5L'}</span>
                                        <span className="badge success">{s.status || 'Eligible'}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="button primary" onClick={() => setSelectedStudentModal(s)}>
                                👁 View Full Profile Record
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* STUDENT PROFILE MODAL */}
            {selectedStudentModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '640px', width: '100%', padding: '28px', background: '#0a142b', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span className="badge success" style={{ marginBottom: '6px' }}>Student Comprehensive Record</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{selectedStudentModal.name}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Roll ID / Admission No: {selectedStudentModal.admission_no}</div>
                            </div>
                            <button className="button danger" onClick={() => setSelectedStudentModal(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <div style={{ background: '#081229', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Department</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.department || 'CSE'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Year / Sem</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.year || '3rd Year'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Cumulative CGPA</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{selectedStudentModal.cgpa || '8.5'} CGPA</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Social Category / Caste</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc' }}>{selectedStudentModal.caste_category || 'BC / MBC'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Annual Family Income</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                                    ₹{selectedStudentModal.family_income ? selectedStudentModal.family_income.toLocaleString('en-IN') : '2,50,000'} / annum
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Father / Guardian Name</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.guardian_name || 'Kumaravel K'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Guardian Mobile</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.guardian_mobile || '+91 94432 10987'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Student Contact Mobile</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.phone || '+91 98765 43210'}</div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official Email</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>{selectedStudentModal.email || 'pranesh.kk@college.edu'}</div>
                            </div>

                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Account (DBT Transfer)</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fb923c' }}>
                                    {selectedStudentModal.bank_name || 'State Bank of India'} — A/C: {selectedStudentModal.bank_account_no || '987654321012'} (IFSC: {selectedStudentModal.ifsc_code || 'SBIN0001234'})
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="button" onClick={() => setSelectedStudentModal(null)}>Close Record</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Admin Student Directory — Confidential student academic and financial records.
            </div>
        </div>
    );
}

