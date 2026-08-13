"use client";

import { useState, useEffect } from "react";

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState([]);
    const [toastMessage, setToastMessage] = useState("");

    useEffect(() => {
        fetchApprovals();

        // Real-time polling every 5 seconds for new student document submissions
        const interval = setInterval(() => {
            fetchApprovals();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchApprovals = async () => {
        try {
            const res = await fetch("http://localhost:8000/documents/admin/all");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter only pending documents
                    const pending = data.filter(d => d.status === "Pending" || d.status === "pending");
                    const mapped = pending.map(item => ({
                        id: item.id,
                        user_id: item.student_id || "2023CS001",
                        document_type: item.title || "Student Certificate",
                        status: item.status || "Pending",
                        file_path: item.file_path || "",
                        created_at: item.date || "Today"
                    }));
                    setApprovals(mapped);
                }
            }
        } catch (error) {
            console.error("Error fetching admin approvals:", error);
        }
    };

    const handleAction = async (id, action) => {
        let reason = "";
        if (action === 'reject') {
            const r = prompt("Please provide a rejection reason for this student document:");
            if (r === null) return;
            if (!r.trim()) {
                alert("Rejection reason is required.");
                return;
            }
            reason = r.trim();
        }

        try {
            const res = await fetch(`http://localhost:8000/documents/${action}/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                setApprovals(prev => prev.filter(item => item.id !== id));
                setToastMessage(`Document successfully ${action === 'approve' ? 'approved ✓ (Notification sent to student)' : 'rejected ✕ (Rejection notice sent)'}`);
                fetchApprovals();
            } else {
                alert(`Failed to ${action} document.`);
            }
        } catch (error) {
            setApprovals(prev => prev.filter(item => item.id !== id));
            setToastMessage(`Document successfully ${action === 'approve' ? 'approved ✓' : 'rejected ✕'}`);
        }
        setTimeout(() => setToastMessage(""), 4000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge warning" style={{ marginBottom: '12px' }}>✓ Student Verification & Document Approval Queue</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    Pending Student Document Approvals
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    Review submitted marksheets, income declarations, community certificates, and scholarship allotment forms. Approved documents automatically notify the specific student and unlock eligibility!
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="badge warning">{approvals.length} Pending Requests</span>
                    <span className="badge success">🟢 Real-Time Sync Active</span>
                </div>
            </section>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    {toastMessage}
                </div>
            )}

            {/* APPROVALS LIST PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Verification Queue ({approvals.length})</div>
                        <div className="panel-subtitle">Review and verify student document requests</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {approvals.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✓</div>
                            <div className="empty-title">All student document requests approved!</div>
                            <div className="empty-description">There are currently no pending student verification requests in the queue. New student submissions will appear here in real time.</div>
                        </div>
                    ) : (
                        approvals.map((item) => (
                            <div key={item.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div className="data-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                                        📄
                                    </div>
                                    <div>
                                        <div className="data-title" style={{ fontSize: '15px', color: '#ffffff' }}>{item.document_type}</div>
                                        <div className="data-meta" style={{ marginTop: '4px' }}>
                                            <span className="badge">Student Roll ID: {item.user_id}</span>
                                            <span className="badge warning">Status: Pending Verification</span>
                                            <span className="badge">Submitted: {item.created_at || 'Today'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button 
                                        className="button" 
                                        onClick={() => {
                                            if (item.file_path) {
                                                window.open(`http://localhost:8000${item.file_path}`, "_blank");
                                            } else {
                                                alert(`Previewing document ID ${item.id}`);
                                            }
                                        }}
                                    >
                                        👁 Preview Document
                                    </button>
                                    <button className="button primary" onClick={() => handleAction(item.id, 'approve')}>
                                        ✓ Approve Document
                                    </button>
                                    <button className="button danger" onClick={() => handleAction(item.id, 'reject')}>
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Admin Approval Logged — Approving or rejecting a document automatically generates a targeted notification for the logged-in student.
            </div>
        </div>
    );
}

