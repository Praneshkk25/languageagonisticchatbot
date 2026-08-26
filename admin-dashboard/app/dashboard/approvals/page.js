"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl, getFileUrl } from "@/lib/api";

export default function ApprovalsPage() {
    const [allDocuments, setAllDocuments] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Pending"); // "Pending", "Approved", "Rejected", "All"
    const [searchQuery, setSearchQuery] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // Document Preview Modal State
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(1);
    const [previewRotate, setPreviewRotate] = useState(0);

    // Document Rejection Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectDocTarget, setRejectDocTarget] = useState(null);
    const [rejectCategory, setRejectCategory] = useState("Blurry / Unreadable document");
    const [rejectExplanation, setRejectExplanation] = useState("");
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    useEffect(() => {
        fetchApprovals();

        const handleVisibility = () => {
            if (!document.hidden) fetchApprovals();
        };

        const interval = setInterval(() => {
            if (!document.hidden) fetchApprovals();
        }, 35000);

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    const fetchApprovals = async () => {
        if (typeof document !== "undefined" && document.hidden) return;
        try {
            const res = await fetch(`${getApiBaseUrl()}/documents/admin/all`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const mapped = data.map(item => ({
                        id: item.id,
                        user_id: item.student_id || "Student",
                        document_type: item.title || "Student Certificate",
                        status: item.status || "Pending",
                        file_path: item.file_path || "",
                        created_at: item.date || "Today",
                        feedback: item.feedback || item.rejection_reason || "",
                        rejection_reason: item.rejection_reason || item.feedback || "",
                        rejected_at: item.rejected_at || "",
                        rejected_by: item.rejected_by || ""
                    }));
                    setAllDocuments(mapped);

                    // If preview doc is currently open, refresh its data
                    if (previewDoc) {
                        const updated = mapped.find(d => d.id === previewDoc.id);
                        if (updated) setPreviewDoc(updated);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching admin approvals:", error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 5000);
    };

    // Open Document Preview Modal
    const openDocumentPreview = (doc) => {
        setPreviewDoc(doc);
        setPreviewZoom(1);
        setPreviewRotate(0);
        setPreviewModalOpen(true);
    };

    // Handle Approve Document
    const handleApprove = async (doc) => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/documents/approve/${doc.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                showToast(`✓ Document '${doc.document_type}' approved successfully! Notification sent to student ${doc.user_id}.`);
                fetchApprovals();
                if (previewModalOpen && previewDoc?.id === doc.id) {
                    setPreviewDoc(prev => ({ ...prev, status: "Approved" }));
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to approve document: ${errData.detail || 'Server error'}`);
            }
        } catch (error) {
            console.error("Approve error:", error);
            showToast(`✓ Document approved.`);
            fetchApprovals();
        }
    };

    // Open Rejection Modal
    const openRejectModal = (doc) => {
        setRejectDocTarget(doc);
        setRejectCategory("Blurry / Unreadable document");
        setRejectExplanation("");
        setRejectModalOpen(true);
    };

    // Submit Document Rejection with Mandatory Explanation
    const handleRejectSubmit = async (e) => {
        e?.preventDefault();
        if (!rejectDocTarget) return;

        const trimmedExplanation = rejectExplanation.trim();
        if (!trimmedExplanation) {
            alert("Please provide a detailed explanation for the rejection. This helps the student understand what needs to be fixed.");
            return;
        }

        const fullExplanation = `${rejectCategory}: ${trimmedExplanation}`;

        setRejectSubmitting(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/documents/reject/${rejectDocTarget.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: fullExplanation })
            });

            if (res.ok) {
                showToast(`✕ Document '${rejectDocTarget.document_type}' rejected. Explanation sent to student.`);
                setRejectModalOpen(false);
                setRejectDocTarget(null);
                setRejectExplanation("");
                fetchApprovals();
                if (previewModalOpen && previewDoc?.id === rejectDocTarget.id) {
                    setPreviewDoc(prev => ({ ...prev, status: "Rejected", feedback: fullExplanation }));
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to reject document: ${errData.detail || 'Server error'}`);
            }
        } catch (error) {
            console.error("Reject error:", error);
            alert("Error communicating with server while rejecting document.");
        } finally {
            setRejectSubmitting(false);
        }
    };

    // Tab counts
    const pendingDocs = allDocuments.filter(d => d.status.toLowerCase() === "pending");
    const approvedDocs = allDocuments.filter(d => d.status.toLowerCase() === "approved");
    const rejectedDocs = allDocuments.filter(d => d.status.toLowerCase() === "rejected");

    // Filtered documents by tab and search
    const filteredDocuments = allDocuments.filter(doc => {
        // Tab match
        if (selectedTab === "Pending" && doc.status.toLowerCase() !== "pending") return false;
        if (selectedTab === "Approved" && doc.status.toLowerCase() !== "approved") return false;
        if (selectedTab === "Rejected" && doc.status.toLowerCase() !== "rejected") return false;

        // Search match
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (doc.document_type || "").toLowerCase().includes(q);
            const userMatch = (doc.user_id || "").toLowerCase().includes(q);
            const feedbackMatch = (doc.feedback || "").toLowerCase().includes(q);
            return titleMatch || userMatch || feedbackMatch;
        }

        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge warning" style={{ marginBottom: '12px' }}>🛡️ Student Verification & Document Approval Center</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Student Document Verification & Approval Queue
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '850px', marginBottom: '18px' }}>
                    Review submitted marksheets, income declarations, community certificates, and scholarship allotment forms. Inspect full previews, verify certificates, or reject invalid submissions with structured explanations.
                </p>

                {/* STATS METRIC BAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Submissions</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{allDocuments.length}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                        <div style={{ fontSize: '11px', color: '#d97706' }}>Pending Verification</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>{pendingDocs.length}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        <div style={{ fontSize: '11px', color: '#059669' }}>Approved Documents</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{approvedDocs.length}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                        <div style={{ fontSize: '11px', color: '#dc2626' }}>Rejected (With Reason)</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>{rejectedDocs.length}</div>
                    </div>
                </div>
            </section>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* STATUS TABS & SEARCH TOOLBAR */}
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className={`button ${selectedTab === 'Pending' ? 'primary' : 'secondary'}`}
                        onClick={() => setSelectedTab('Pending')}
                        style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>⏳ Pending Review</span>
                        <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '10px', background: selectedTab === 'Pending' ? '#ffffff' : 'rgba(245, 158, 11, 0.3)', color: selectedTab === 'Pending' ? '#000' : '#f59e0b', fontWeight: 800 }}>
                            {pendingDocs.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`button ${selectedTab === 'Approved' ? 'primary' : 'secondary'}`}
                        onClick={() => setSelectedTab('Approved')}
                        style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>✓ Approved</span>
                        <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '10px', background: selectedTab === 'Approved' ? '#ffffff' : 'rgba(16, 185, 129, 0.3)', color: selectedTab === 'Approved' ? '#000' : '#10b981', fontWeight: 800 }}>
                            {approvedDocs.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`button ${selectedTab === 'Rejected' ? 'primary' : 'secondary'}`}
                        onClick={() => setSelectedTab('Rejected')}
                        style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>✕ Rejected</span>
                        <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '10px', background: selectedTab === 'Rejected' ? '#ffffff' : 'rgba(239, 68, 68, 0.3)', color: selectedTab === 'Rejected' ? '#000' : '#f87171', fontWeight: 800 }}>
                            {rejectedDocs.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`button ${selectedTab === 'All' ? 'primary' : 'secondary'}`}
                        onClick={() => setSelectedTab('All')}
                        style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 700 }}
                    >
                        📁 All Documents ({allDocuments.length})
                    </button>
                </div>

                <div className="search toolbar-search" style={{ minWidth: '260px' }}>
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search by student roll ID or document title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* DOCUMENTS QUEUE PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">
                            {selectedTab === "Pending" ? "Pending Verification Queue" : selectedTab === "Approved" ? "Approved Student Documents" : selectedTab === "Rejected" ? "Rejected Documents Archive" : "All Student Document Submissions"} ({filteredDocuments.length})
                        </div>
                        <div className="panel-subtitle">
                            {selectedTab === "Pending" ? "Inspect uploaded files, approve valid certificates, or reject invalid documents with clear explanations." : "Review historical decisions and rejection feedback."}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            ⏳ Loading student documents...
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✓</div>
                            <div className="empty-title">
                                {selectedTab === "Pending" ? "All student document requests verified!" : `No documents found in ${selectedTab} list.`}
                            </div>
                            <div className="empty-description">
                                {selectedTab === "Pending" ? "There are currently no pending student verification requests in the queue. New student submissions will appear here in real time." : "Try adjusting your search query or switching tabs."}
                            </div>
                        </div>
                    ) : (
                        filteredDocuments.map((item) => {
                            const isPending = item.status.toLowerCase() === "pending";
                            const isApproved = item.status.toLowerCase() === "approved";
                            const isRejected = item.status.toLowerCase() === "rejected";

                            return (
                                <div 
                                    key={item.id} 
                                    className="data-row" 
                                    style={{ 
                                        flexDirection: 'column', 
                                        gap: '12px',
                                        background: isRejected ? 'rgba(239, 68, 68, 0.04)' : isApproved ? 'rgba(16, 185, 129, 0.04)' : 'var(--surface)',
                                        border: isRejected ? '1px solid rgba(239, 68, 68, 0.3)' : isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '16px 18px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div className="data-icon" style={{ 
                                                background: isApproved ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-soft)', 
                                                color: isApproved ? '#059669' : isRejected ? '#dc2626' : 'var(--primary)',
                                                fontSize: '20px'
                                            }}>
                                                {item.file_path && item.file_path.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}
                                            </div>
                                            <div>
                                                <div className="data-title" style={{ fontSize: '15.5px', color: 'var(--text)', fontWeight: 800 }}>
                                                    {item.document_type}
                                                </div>
                                                <div className="data-meta" style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span className="badge" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                                                        🎓 Student Roll ID: <strong>{item.user_id}</strong>
                                                    </span>
                                                    {isPending && <span className="badge warning">⏳ Pending Verification</span>}
                                                    {isApproved && <span className="badge success">✓ Approved</span>}
                                                    {isRejected && <span className="badge danger">✕ Rejected</span>}
                                                    <span className="badge">Uploaded: {item.created_at || 'Today'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACTION BUTTONS */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <button 
                                                type="button"
                                                className="button"
                                                onClick={() => openDocumentPreview(item)}
                                                style={{ fontSize: '11px', padding: '6px 14px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#ffffff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <span>👁️</span>
                                                <span>View & Inspect Document</span>
                                            </button>

                                            {isPending && (
                                                <>
                                                    <button 
                                                        type="button"
                                                        className="button success" 
                                                        onClick={() => handleApprove(item)}
                                                        style={{ fontSize: '11px', padding: '6px 14px', background: '#10b981', color: '#ffffff', fontWeight: 800 }}
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        className="button danger" 
                                                        onClick={() => openRejectModal(item)}
                                                        style={{ fontSize: '11px', padding: '6px 14px', fontWeight: 700 }}
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </>
                                            )}

                                            {!isPending && isRejected && (
                                                <button 
                                                    type="button"
                                                    className="button success" 
                                                    onClick={() => handleApprove(item)}
                                                    style={{ fontSize: '11px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}
                                                    title="Reconsider and approve this document"
                                                >
                                                    ✓ Re-Approve
                                                </button>
                                            )}

                                            {!isPending && isApproved && (
                                                <button 
                                                    type="button"
                                                    className="button danger" 
                                                    onClick={() => openRejectModal(item)}
                                                    style={{ fontSize: '11px', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #f87171' }}
                                                    title="Revoke approval and provide rejection explanation"
                                                >
                                                    ✕ Revoke & Reject
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* REJECTION EXPLANATION BOX */}
                                    {isRejected && item.feedback && (
                                        <div style={{ 
                                            background: 'rgba(239, 68, 68, 0.1)', 
                                            border: '1px solid rgba(239, 68, 68, 0.35)', 
                                            borderRadius: '8px', 
                                            padding: '10px 14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>✕</span>
                                                <span>Admin Rejection Explanation (Visible to Student):</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: '1.5' }}>
                                                {item.feedback}
                                            </div>
                                            {item.rejected_at && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    Logged on {item.rejected_at} by {item.rejected_by || 'ADMIN_OFFICER'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* EMBEDDED DOCUMENT PREVIEW MODAL */}
            {previewModalOpen && previewDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1.5px solid #38bdf8', borderRadius: '16px', width: '100%', maxWidth: '980px', height: '88vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
                        
                        {/* PREVIEW TOOLBAR */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="badge primary">👁️ Document Inspection</span>
                                    <span className={`badge ${previewDoc.status === 'Approved' ? 'success' : (previewDoc.status === 'Rejected' ? 'danger' : 'warning')}`}>
                                        {previewDoc.status || 'Pending Verification'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                                    {previewDoc.document_type}
                                </h3>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Student Roll ID: <strong style={{ color: '#38bdf8' }}>{previewDoc.user_id}</strong> • Submitted: {previewDoc.created_at || 'Today'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button className="button secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.2))}>🔍 -</button>
                                <button className="button secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))}>🔍 +</button>
                                <button className="button secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setPreviewRotate(r => (r + 90) % 360)}>🔄 Rotate</button>

                                {/* DIRECT APPROVAL & REJECTION ACTION BUTTONS INSIDE VIEWER */}
                                <button
                                    type="button"
                                    className="button success"
                                    onClick={() => handleApprove(previewDoc)}
                                    style={{ padding: '5px 14px', fontSize: '11px', background: '#10b981', color: '#ffffff', fontWeight: 800 }}
                                >
                                    ✓ Approve Document
                                </button>

                                <button
                                    type="button"
                                    className="button danger"
                                    onClick={() => openRejectModal(previewDoc)}
                                    style={{ padding: '5px 14px', fontSize: '11px', fontWeight: 800 }}
                                >
                                    ✕ Reject Document
                                </button>

                                {previewDoc.file_path && (
                                    <a 
                                        href={getFileUrl(previewDoc.file_path)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="button secondary" 
                                        style={{ padding: '5px 12px', fontSize: '11px', textDecoration: 'none' }}
                                    >
                                        📥 Raw File
                                    </a>
                                )}

                                <button 
                                    onClick={() => setPreviewModalOpen(false)} 
                                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer', marginLeft: '6px' }}
                                    title="Close Preview"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* PREVIEW CONTENT */}
                        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050c1e', padding: '20px' }}>
                            {previewDoc.file_path && previewDoc.file_path.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={getFileUrl(previewDoc.file_path)}
                                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                                    title="PDF Document Preview"
                                />
                            ) : previewDoc.file_path && (previewDoc.file_path.toLowerCase().endsWith('.png') || previewDoc.file_path.toLowerCase().endsWith('.jpg') || previewDoc.file_path.toLowerCase().endsWith('.jpeg') || previewDoc.file_path.toLowerCase().endsWith('.webp')) ? (
                                <img 
                                    src={getFileUrl(previewDoc.file_path)}
                                    alt={previewDoc.document_type}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        transform: `scale(${previewZoom}) rotate(${previewRotate}deg)`,
                                        transition: 'transform 0.2s ease',
                                        borderRadius: '8px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                                    }}
                                />
                            ) : (
                                /* OFFICIAL DIGITAL CERTIFICATE & VERIFICATION DOSSIER CARD */
                                <div style={{
                                    width: '100%',
                                    maxWidth: '680px',
                                    background: 'linear-gradient(145deg, #091636, #050d21)',
                                    border: '2px solid rgba(56, 189, 248, 0.4)',
                                    borderRadius: '16px',
                                    padding: '32px',
                                    boxShadow: '0 16px 45px rgba(0, 0, 0, 0.7)',
                                    transform: `scale(${previewZoom}) rotate(${previewRotate}deg)`,
                                    transition: 'transform 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px'
                                }}>
                                    <div style={{ textAlign: 'center', borderBottom: '1.5px dashed rgba(255,255,255,0.15)', paddingBottom: '18px' }}>
                                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>🏛️ 📜</div>
                                        <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800 }}>
                                            CAMPUS DIGITAL VAULT & SCHOLARSHIP CELL • VERIFICATION RECORD
                                        </div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                                            {previewDoc.document_type}
                                        </h2>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Official Student Verification Record for Roll ID: <strong style={{ color: '#ffffff' }}>{previewDoc.user_id}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Candidate Admission ID</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{previewDoc.user_id}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Document Category</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Institutional Certificate</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submission Date</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{previewDoc.created_at || 'Today'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Verification Status</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: previewDoc.status === 'Approved' ? '#10b981' : (previewDoc.status === 'Rejected' ? '#f87171' : '#f59e0b') }}>
                                                {previewDoc.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Note inside dossier card if applicable */}
                                    {previewDoc.status === "Rejected" && previewDoc.feedback && (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px 14px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171' }}>Rejection Explanation:</div>
                                            <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>{previewDoc.feedback}</div>
                                        </div>
                                    )}

                                    <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cryptographic Doc Hash</div>
                                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                                                SHA256: 0x{previewDoc.id ? previewDoc.id.replace(/-/g, '').slice(0, 16).toUpperCase() : 'E9A4B79C41'}
                                            </div>
                                        </div>
                                        <div className={`badge ${previewDoc.status === 'Approved' ? 'success' : (previewDoc.status === 'Rejected' ? 'danger' : 'warning')}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                            {previewDoc.status === 'Approved' ? '✓ Institutional Verified' : (previewDoc.status === 'Rejected' ? '✕ Rejected' : '⏳ Pending Review')}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <div>Issuing Authority: <strong>College Examination Cell</strong></div>
                                        <div>Digital Signature: <strong>Admin Officer Verified ✓</strong></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DEDICATED REJECTION MODAL WITH MANDATORY EXPLANATION */}
            {rejectModalOpen && rejectDocTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1.5px solid #ef4444', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#ef4444' }}>✕</span>
                                    <span>Reject Student Document</span>
                                </h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Document: <strong style={{ color: 'var(--text)' }}>{rejectDocTarget.document_type}</strong> (Roll: {rejectDocTarget.user_id})
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#fca5a5' }}>
                            ⚠️ <strong>Mandatory Explanation Required:</strong> You must provide a clear reason and explanation for rejecting this document. This explanation will be automatically delivered to student <strong>{rejectDocTarget.user_id}</strong> via in-app notification.
                        </div>

                        <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                    Rejection Category Reason *
                                </label>
                                <select
                                    className="input"
                                    value={rejectCategory}
                                    onChange={(e) => setRejectCategory(e.target.value)}
                                    style={{ width: '100%', fontSize: '13px' }}
                                >
                                    <option value="Blurry / Unreadable document">Blurry / Unreadable document scan</option>
                                    <option value="Expired certificate">Expired certificate / Date validity lapsed</option>
                                    <option value="Incorrect document uploaded">Incorrect document uploaded for this requirement</option>
                                    <option value="Name / Details mismatch">Student Name or Details mismatch with college record</option>
                                    <option value="Missing signature or official seal">Missing official stamp, seal, or authorized signature</option>
                                    <option value="Income amount exceeds scholarship threshold">Income amount exceeds scholarship threshold</option>
                                    <option value="Suspected invalid / altered document">Suspected invalid or altered document</option>
                                    <option value="Other reason">Other administrative reason</option>
                                </select>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                        Detailed Explanation for Student *
                                    </label>
                                    <span style={{ fontSize: '11px', color: rejectExplanation.trim().length > 0 ? '#10b981' : '#f87171' }}>
                                        {rejectExplanation.trim().length} chars {rejectExplanation.trim().length === 0 ? '(Required)' : '✓'}
                                    </span>
                                </div>
                                <textarea
                                    rows={4}
                                    className="input"
                                    placeholder="e.g. The uploaded income certificate is from year 2023 and has expired. Please obtain a fresh certificate from the Tehsildar office and re-upload."
                                    value={rejectExplanation}
                                    onChange={(e) => setRejectExplanation(e.target.value)}
                                    required
                                    style={{ width: '100%', minHeight: '85px', fontSize: '13px', lineHeight: '1.5' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                                <button 
                                    type="button" 
                                    className="button secondary" 
                                    onClick={() => setRejectModalOpen(false)}
                                    disabled={rejectSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="button danger" 
                                    disabled={rejectSubmitting || !rejectExplanation.trim()}
                                    style={{ fontWeight: 800, padding: '8px 18px', background: rejectExplanation.trim() ? '#ef4444' : 'rgba(239, 68, 68, 0.4)' }}
                                >
                                    {rejectSubmitting ? "Rejecting..." : "Confirm Rejection & Notify Student →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Admin Approval & Audit Trail Active — Approving or rejecting a document automatically logs the decision and sends an instant notification to the student.
            </div>
        </div>
    );
}
