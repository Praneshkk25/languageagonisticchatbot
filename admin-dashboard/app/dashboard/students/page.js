"use client";

import { useState } from "react";

export default function StudentDirectory() {
    const [searchQuery, setSearchQuery] = useState("");
    const [students] = useState([
        {
            id: 1,
            admission_no: "2023CS001",
            name: "Pranesh K K",
            department: "CSE",
            year: "3rd Year (Sem 5)",
            cgpa: 8.5,
            family_income: 250000,
            status: "Eligible for Merit Scholarship",
            email: "pranesh.kk@college.edu"
        },
        {
            id: 2,
            admission_no: "2023CS042",
            name: "Ananya Ramesh",
            department: "CSE",
            year: "3rd Year (Sem 5)",
            cgpa: 9.1,
            family_income: 180000,
            status: "AICTE Pragati Approved",
            email: "ananya.r@college.edu"
        },
        {
            id: 3,
            admission_no: "2023EC015",
            name: "Karthik Subramanian",
            department: "ECE",
            year: "2nd Year (Sem 3)",
            cgpa: 7.8,
            family_income: 220000,
            status: "Post-Matric Approved",
            email: "karthik.s@college.edu"
        },
        {
            id: 4,
            admission_no: "2023ME088",
            name: "Rahul Viswanathan",
            department: "MECH",
            year: "4th Year (Sem 7)",
            cgpa: 8.2,
            family_income: 350000,
            status: "Sports Waiver Active",
            email: "rahul.v@college.edu"
        }
    ]);

    const [selectedStudentModal, setSelectedStudentModal] = useState(null);

    const filteredStudents = students.filter(s => 
        !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.admission_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>👥 Student Directory & Academic Records</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    Enrolled Students Administration
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    View and manage enrolled student academic profiles, CGPA scores, annual family income declarations, and approved scholarship statuses.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="badge">{students.length} Total Registered Students</span>
                    <span className="badge success">✓ 3.2K Campus Active</span>
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
                        <div key={s.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                                <div className="data-icon" style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#a855f7' }}>
                                    👤
                                </div>
                                <div>
                                    <div className="data-title" style={{ fontSize: '15px', color: '#ffffff' }}>{s.name} ({s.admission_no})</div>
                                    <div className="data-meta" style={{ marginTop: '4px' }}>
                                        <span className="badge">Dept: {s.department}</span>
                                        <span className="badge">CGPA: {s.cgpa}</span>
                                        <span className="badge">Income: ₹{(s.family_income / 100000).toFixed(1)}L</span>
                                        <span className="badge success">{s.status}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="button primary" onClick={() => setSelectedStudentModal(s)}>
                                👁 View Profile Record
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* STUDENT PROFILE MODAL */}
            {selectedStudentModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '540px', width: '100%', padding: '28px', background: '#0a142b', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span className="badge success" style={{ marginBottom: '6px' }}>Student Academic Record</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>{selectedStudentModal.name}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Roll ID: {selectedStudentModal.admission_no}</div>
                            </div>
                            <button className="button danger" onClick={() => setSelectedStudentModal(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <div style={{ background: '#081229', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Department</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.department}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Year / Sem</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.year}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Cumulative CGPA</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{selectedStudentModal.cgpa} CGPA</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Family Annual Income</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>₹{(selectedStudentModal.family_income / 100000).toFixed(1)} Lakhs</div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official Email</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>{selectedStudentModal.email}</div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scholarship Eligibility Status</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{selectedStudentModal.status}</div>
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
                🛡️ Admin Student Directory — Confidential student academic records.
            </div>
        </div>
    );
}
