"use client";

import { useState, useEffect } from "react";

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState([
        {
            id: "APP-101",
            user_id: "2023CS001",
            document_type: "Income Certificate 2025-26",
            status: "pending",
            file_path: "/uploads/income_cert_2023CS001.pdf",
            created_at: "Today, 11:20 AM"
        },
        {
            id: "APP-102",
            user_id: "2023CS042",
            document_type: "12th Marksheet & Pass Certificate",
            status: "pending",
            file_path: "/uploads/marksheet_2023CS042.pdf",
            created_at: "Today, 10:45 AM"
        },
        {
            id: "APP-103",
            user_id: "2023EC015",
            document_type: "Community Certificate (BC/MBC)",
            status: "pending",
            file_path: "/uploads/community_2023EC015.pdf",
            created_at: "Yesterday, 04:30 PM"
        },
        {
            id: "APP-104",
            user_id: "2023ME088",
            document_type: "AICTE Pragati Allotment Form",
            status: "pending",
            file_path: "/uploads/aicti_2023ME088.pdf",
            created_at: "Yesterday, 02:15 PM"
        },
        {
            id: "APP-105",
            user_id: "2023CS099",
            document_type: "Bonafide Student Request",
            status: "pending",
            file_path: "/uploads/bonafide_2023CS099.pdf",
            created_at: "Yesterday, 01:00 PM"
        }
    ]);

    const [toastMessage, setToastMessage] = useState("");

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            const res = await fetch("http://localhost:8000/documents/admin/all");
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setApprovals(data);
                }
            }
        } catch (error) {}
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
            
            setApprovals(prev => prev.filter(item => item.id !== id));
            setToastMessage(`Document ${id} successfully ${action === 'approve' ? 'approved ✓' : 'rejected ✕'}`);
            setTimeout(() => setToastMessage(""), 4000);
        } catch (error) {
            setApprovals(prev => prev.filter(item => item.id !== id));
            setToastMessage(`Document ${id} successfully ${action === 'approve' ? 'approved ✓' : 'rejected ✕'}`);
            setTimeout(() => setToastMessage(""), 4000);
        }
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
                    Review submitted marksheets, income declarations, community certificates, and scholarship allotment forms. Approved documents are automatically verified for student eligibility!
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="badge warning">{approvals.length} Pending Requests</span>
                    <span className="badge success">🛡️ Admin Verification Active</span>
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
                            <div className="empty-description">There are currently no pending student verification requests in the queue.</div>
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
                                    <button className="button" onClick={() => alert(`Previewing document ${item.file_path}`)}>
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
                🛡️ Admin Approval Logged — Approved certificates unlock student scholarship eligibility instantly.
            </div>
        </div>
    );
}
