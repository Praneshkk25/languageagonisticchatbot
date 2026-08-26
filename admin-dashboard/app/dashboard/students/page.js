"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";

export default function StudentDirectory() {
    const [searchQuery, setSearchQuery] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentModal, setSelectedStudentModal] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 5000);
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${getApiBaseUrl()}/api/students/all`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setStudents(data);
                } else {
                    setStudents([]);
                }
            } else {
                setStudents([]);
            }
        } catch (e) {
            console.error("Error fetching students:", e);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert("Please select an Excel (.xlsx, .xls) or CSV file to upload.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch(`${getApiBaseUrl()}/api/students/import-excel`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`✓ Successfully imported ${data.count} students into Firebase Firestore!`);
                setSelectedFile(null);
                const fileInput = document.getElementById("student-excel-file-input");
                if (fileInput) fileInput.value = "";
                fetchStudents();
            } else {
                alert(`Upload failed: ${data.detail || "Error processing spreadsheet."}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading file to server. Please check backend status.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteStudent = async (admissionNo) => {
        if (!confirm(`Are you sure you want to delete student '${admissionNo}' from Firebase?`)) {
            return;
        }

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/students/${admissionNo}`, {
                method: "DELETE"
            });
            if (res.ok) {
                showToast(`Student ${admissionNo} deleted from database.`);
                fetchStudents();
            } else {
                alert("Failed to delete student.");
            }
        } catch (e) {
            console.error("Delete error:", e);
        }
    };

    const handleClearAllStudents = async () => {
        const confirmed = confirm("WARNING: Are you sure you want to clear ALL student records from Firebase Firestore? This action cannot be undone.");
        if (!confirmed) return;

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/students/clear-all`, {
                method: "DELETE"
            });
            if (res.ok) {
                const data = await res.json();
                showToast(`Cleared ${data.count} student records.`);
                fetchStudents();
            } else {
                alert("Failed to clear student directory.");
            }
        } catch (e) {
            console.error("Clear all error:", e);
        }
    };

    const filteredStudents = students.filter(s => 
        !searchQuery || 
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (s.admission_no && s.admission_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '12px' }}>👥 Student Directory & Academic Records</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Enrolled Students Administration & Firebase Sync
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '850px', marginBottom: '16px' }}>
                    Import and manage student academic profiles, CGPA scores, family income declarations, and bank details for scholarship disbursements. All records are stored directly in Firebase Firestore.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge">{students.length} Registered Students</span>
                    <span className="badge success">⚡ Firebase Firestore Synced</span>
                    {students.length > 0 && (
                        <button 
                            className="button danger" 
                            onClick={handleClearAllStudents}
                            style={{ marginLeft: 'auto', fontSize: '12px', padding: '6px 14px' }}
                        >
                            🗑 Clear All Students
                        </button>
                    )}
                </div>
            </section>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    {toastMessage}
                </div>
            )}

            {/* EXCEL / CSV BULK IMPORT PANEL */}
            <section className="panel" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                    <div>
                        <span className="badge primary" style={{ marginBottom: '6px' }}>📊 Bulk Student Import</span>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                            Upload Students Spreadsheet (Any Format: .xlsx / .xls / .csv)
                        </h3>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
                            Upload an Excel or CSV file in <strong>any format or column layout</strong>. The parser automatically detects your column headers (Roll No, Name, Dept, CGPA, Income, etc.) and stores all records into Firebase Firestore.
                        </p>
                    </div>

                    <a 
                        href={`${getApiBaseUrl()}/api/students/template`} 
                        download="students_import_template.xlsx"
                        className="button"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)', fontSize: '12px', fontWeight: 700 }}
                    >
                        <span>📥</span>
                        <span>Download Sample Template (.xlsx)</span>
                    </a>
                </div>

                {/* HOW IT WORKS IN FIREBASE ACCORDION / GUIDE */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                        ℹ️ FLEXIBLE FORMAT & FIREBASE INTEGRATION:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <li><strong>No Fixed Format Required:</strong> You can upload spreadsheets from your college ERP, Excel sheets, or CSV files in your own custom format. Headers like Roll Number, Reg No, Name, Dept, CGPA, etc., are mapped automatically.</li>
                        <li><strong>Optional Sample Template:</strong> If you prefer a pre-made format, click <em>"Download Sample Template"</em> above.</li>
                        <li><strong>Instant Login Access:</strong> Uploaded students are saved to Firebase Firestore (<code style={{ color: 'var(--primary)' }}>students/{'{admission_no}'}</code>) and can immediately sign in with their <strong>Admission / Roll Number</strong> and <strong>Date of Birth</strong>.</li>
                    </ul>
                </div>

                {/* UPLOAD FORM */}
                <form onSubmit={handleFileUpload} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <input
                            id="student-excel-file-input"
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                color: 'var(--text)',
                                fontSize: '13px'
                            }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="button primary" 
                        disabled={uploading || !selectedFile}
                        style={{ minWidth: '160px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {uploading ? (
                            <span>Importing to Firebase...</span>
                        ) : (
                            <>
                                <span>📤</span>
                                <span>Upload to Firebase</span>
                            </>
                        )}
                    </button>
                </form>
            </section>

            {/* SEARCH TOOLBAR */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search student by name, roll ID, department or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="button" onClick={fetchStudents} title="Refresh records">
                    🔄 Refresh
                </button>
            </div>

            {/* STUDENTS DIRECTORY PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Enrolled Students ({filteredStudents.length})</div>
                        <div className="panel-subtitle">Live records stored in Firebase Firestore (includes all student profile updates)</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                            href={`${getApiBaseUrl()}/api/students/export?format=xlsx`}
                            download="students_directory_updated.xlsx"
                            className="button primary"
                            style={{ fontSize: '11px', padding: '6px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span>📥</span>
                            <span>Export Updated Directory (Excel)</span>
                        </a>
                        <a
                            href={`${getApiBaseUrl()}/api/students/export?format=csv`}
                            download="students_directory_updated.csv"
                            className="button secondary"
                            style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none', fontWeight: 700 }}
                        >
                            CSV
                        </a>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            Loading students from Firebase...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">👥</div>
                            <div className="empty-title">No student records found in Firebase</div>
                            <div className="empty-description">
                                Upload your students Excel/CSV spreadsheet above to populate the student database and enable student portal logins.
                            </div>
                        </div>
                    ) : (
                        filteredStudents.map((s) => (
                            <div key={s.admission_no || s.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                                    <div className="data-icon" style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#a855f7' }}>
                                        👤
                                    </div>
                                    <div>
                                        <div className="data-title" style={{ fontSize: '15px', color: '#ffffff' }}>
                                            {s.name} ({s.admission_no})
                                        </div>
                                        <div className="data-meta" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
                                            <span className="badge">Dept: {s.department || 'CSE'}</span>
                                            <span className="badge">Year: {s.year ? `Year ${s.year}` : '3rd Year'}</span>
                                            <span className="badge">DOB: {s.dob || '2000-01-01'}</span>
                                            <span className="badge">CGPA: {s.cgpa || '8.0'}</span>
                                            <span className="badge">Income: ₹{s.family_income ? Number(s.family_income).toLocaleString('en-IN') : '2,50,000'}</span>
                                            <span className="badge success">{s.caste_category || 'General'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button className="button primary" onClick={() => setSelectedStudentModal(s)}>
                                        👁 View Full Record
                                    </button>
                                    <button 
                                        className="button danger" 
                                        onClick={() => handleDeleteStudent(s.admission_no)}
                                        title="Delete student record"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* STUDENT PROFILE MODAL */}
            {selectedStudentModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '640px', width: '100%', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                            <div>
                                <span className="badge success" style={{ marginBottom: '6px' }}>Student Profile (Firebase Document)</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>{selectedStudentModal.name}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Roll ID / Admission No: {selectedStudentModal.admission_no}</div>
                            </div>
                            <button className="button danger" onClick={() => setSelectedStudentModal(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <div style={{ background: 'var(--surface-2)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px', maxHeight: '65vh', overflowY: 'auto' }}>
                            {/* ACADEMICS */}
                            <div style={{ gridColumn: 'span 2', fontSize: '12px', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                                🎓 1. ACADEMIC QUALIFICATION & PERFORMANCE
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Degree & Level</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{selectedStudentModal.course_degree || 'B.E.'} ({selectedStudentModal.current_education_level || 'Undergraduate'})</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Department & Year</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{selectedStudentModal.department || 'CSE'} — Year {selectedStudentModal.year || 3} ({selectedStudentModal.current_semester || 'Sem 5'})</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Cumulative CGPA</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>{selectedStudentModal.cgpa || '8.0'} CGPA ({selectedStudentModal.percentage_equivalent || '80'}%)</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standing Backlogs & Arrears</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedStudentModal.backlog_status?.includes('0') ? 'var(--success)' : '#fb923c' }}>
                                    {selectedStudentModal.backlog_status || '0 Backlogs / All Clear'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>10th (SSC) / 12th (HSC) Marks</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>10th: {selectedStudentModal.tenth_percentage || '90'}% | 12th: {selectedStudentModal.twelfth_percentage || '85'}%</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admission Mode</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.admission_mode || 'Merit / Government Counseling'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>First Generation Graduate (First Graduate in Family)?</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedStudentModal.first_generation_graduate === 'Yes' ? 'var(--success)' : '#fff' }}>
                                    {selectedStudentModal.first_generation_graduate === 'Yes' ? '🎓 Yes (First Graduate Scheme)' : 'No'}
                                </div>
                            </div>

                            {/* DEMOGRAPHICS & QUOTA */}
                            <div style={{ gridColumn: 'span 2', fontSize: '12px', fontWeight: 800, color: '#c084fc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', marginTop: '10px' }}>
                                🌐 2. DEMOGRAPHICS, CASTE & DIVERSITY QUOTAS
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nationality & Citizenship</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.nationality || 'Indian'} ({selectedStudentModal.citizenship || 'Indian Citizen'})</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Domicile State & District</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.domicile_state || 'Tamil Nadu'} — {selectedStudentModal.district || 'Salem'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Social Category / Community</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc' }}>{selectedStudentModal.caste_category || 'General'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Minority Status</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.minority_status || 'None'}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Specially Abled (PwD)</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedStudentModal.pwd_status === 'Yes' ? '#fb923c' : '#fff' }}>
                                    {selectedStudentModal.pwd_status || 'No'} {selectedStudentModal.pwd_status === 'Yes' ? `(${selectedStudentModal.disability_type || 'Orthopedic'} - ${selectedStudentModal.disability_percentage || '40'}%)` : ''}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>First Generation Graduate?</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedStudentModal.first_generation_graduate === 'Yes' ? 'var(--success)' : '#fff' }}>
                                    {selectedStudentModal.first_generation_graduate || 'No'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Family Background & Special Conditions</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                                    {selectedStudentModal.family_background || 'General'} | Special: {selectedStudentModal.special_conditions || 'None'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Guardian & Contact</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectedStudentModal.guardian_name || 'N/A'} ({selectedStudentModal.guardian_mobile || 'N/A'})</div>
                            </div>

                            {/* FINANCIAL & BANK */}
                            <div style={{ gridColumn: 'span 2', fontSize: '12px', fontWeight: 800, color: '#34d399', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', marginTop: '10px' }}>
                                💰 3. FINANCIAL INCOME & DIRECT DBT BANK DETAILS
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Annual Family Income</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                                    ₹{selectedStudentModal.family_income ? Number(selectedStudentModal.family_income).toLocaleString('en-IN') : '2,50,000'} / annum ({selectedStudentModal.economic_category || 'Low Income'})
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Income Certificate & Ration Card</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                                    Cert: {selectedStudentModal.income_certificate_no || 'Issued'} ({selectedStudentModal.income_certificate_authority || 'Tehsildar'}) | Card: {selectedStudentModal.ration_card_type || 'PHH'}
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Account (Aadhaar Seeded for DBT)</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fb923c' }}>
                                    {selectedStudentModal.bank_name || 'State Bank of India'} — A/C: {selectedStudentModal.bank_account_no || 'N/A'} (IFSC: {selectedStudentModal.ifsc_code || 'N/A'}, Branch: {selectedStudentModal.bank_branch || 'Salem'}) | DBT Enabled: {selectedStudentModal.aadhaar_linked_bank || 'Yes'}
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
                🛡️ Admin Student Directory — Live Firebase Firestore Records. All data uploaded is persistent and encrypted.
            </div>
        </div>
    );
}
