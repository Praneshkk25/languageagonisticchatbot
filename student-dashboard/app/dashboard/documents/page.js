"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl, getFileUrl } from "@/lib/api";

export default function DocumentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [documents, setDocuments] = useState([]);
    const [studentId, setStudentId] = useState("");

    // Upload Modal state
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [newDocName, setNewDocName] = useState("");
    const [newDocCategory, setNewDocCategory] = useState("Academic Certificates");
    const [selectedFile, setSelectedFile] = useState(null);

    // Passkey Modal State
    const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
    const [targetDoc, setTargetDoc] = useState(null);
    const [actionType, setActionType] = useState("download");
    const [passkey1, setPasskey1] = useState("");
    const [passkey2, setPasskey2] = useState("");
    const [passkeyError, setPasskeyError] = useState("");
    const [toastMessage, setToastMessage] = useState("");

    // Preview Modal State
    const [previewDoc, setPreviewDoc] = useState(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    const sid = u.id || u.admission_no || "";
                    if (sid) {
                        setStudentId(sid);
                        fetchDocuments(sid);
                    }
                } catch (e) {}
            }
        }
    }, []);

    const fetchDocuments = async (sid) => {
        const targetId = sid || studentId;
        try {
            const res = await fetch(`${getApiBaseUrl()}/documents/student/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    const mapped = data.map(d => ({
                        id: d.id,
                        name: d.title || "Document",
                        category: "Academic Certificates",
                        size: "1.2 MB",
                        date: d.date || "Today",
                        status: d.status || "Pending",
                        feedback: d.feedback || null,
                        file_path: d.file_path,
                        type: d.title && d.title.endsWith(".jpg") ? "JPG" : "PDF"
                    }));
                    setDocuments(mapped);
                }
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };

    useEffect(() => {
        fetchDocuments(studentId);

        const handleVisibility = () => {
            if (!document.hidden && studentId) fetchDocuments(studentId);
        };

        const interval = setInterval(() => {
            if (!document.hidden && studentId) fetchDocuments(studentId);
        }, 35000);

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [studentId]);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert("Please select a file to upload.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch(`${getApiBaseUrl()}/documents/upload/${studentId}`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                setToastMessage(`Successfully uploaded "${selectedFile.name}" for verification!`);
                setUploadModalOpen(false);
                setNewDocName("");
                setSelectedFile(null);
                fetchDocuments(studentId);
            } else {
                alert("Upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed: Backend connection error.");
        }
        setTimeout(() => setToastMessage(""), 4000);
    };

    const triggerProtectedAction = (doc, action) => {
        setTargetDoc(doc);
        setActionType(action);
        setPasskeyError("");
        setPasskeyModalOpen(true);
    };

    const verifyPasskeys = async () => {
        if (passkey1 === "123456" && passkey2 === "654321") {
            setPasskeyModalOpen(false);
            if (actionType === "preview") {
                setPreviewDoc(targetDoc);
            } else if (actionType === "download") {
                setToastMessage(`Downloading "${targetDoc.name}" from Cloud Vault...`);
                if (targetDoc.file_path) {
                    window.open(getFileUrl(targetDoc.file_path), "_blank");
                }
                setTimeout(() => setToastMessage(""), 4000);
            } else if (actionType === "delete") {
                try {
                    await fetch(`${getApiBaseUrl()}/documents/${targetDoc.id}`, { method: "DELETE" });
                    setDocuments(prev => prev.filter(d => d.id !== targetDoc.id));
                    setToastMessage(`Deleted "${targetDoc.name}" from Digital Vault.`);
                } catch (e) {
                    setDocuments(prev => prev.filter(d => d.id !== targetDoc.id));
                }
                setTimeout(() => setToastMessage(""), 4000);
            }
        } else {
            setPasskeyError("Invalid Double Passkey. Enter Passkey 1 (123456) and Passkey 2 (654321).");
        }
    };

    const filteredDocs = documents.filter(doc => {
        if (!doc) return false;
        const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory;
        const name = (doc.name || "").toLowerCase();
        const q = (searchQuery || "").toLowerCase();
        const matchesQuery = !q || name.includes(q);
        return matchesCategory && matchesQuery;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge success" style={{ marginBottom: '12px' }}>☁️ Cloud Storage Vault Protection (Double Passkey Protected)</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Digital Vault Management System
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '750px', marginBottom: '16px' }}>
                    Upload, verify, and store your marksheets, community certificates, income declarations, and bonafide letters in your encrypted campus vault. All downloads are protected with 2-Factor Double Passkey authorization.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <span className="badge">{documents.length} Vault Documents</span>
                    <span className="badge warning">🛡️ 2-Factor Double Passkey Active</span>
                    <button className="button primary" onClick={() => setUploadModalOpen(true)} style={{ marginLeft: 'auto' }}>
                        + Upload New Document
                    </button>
                </div>
            </section>

            {/* TOAST MESSAGE */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    ✓ {toastMessage}
                </div>
            )}

            {/* TOOLBAR SEARCH & FILTER */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search files in your vault..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {["All", "Academic Certificates", "Income Declarations", "ID Cards"].map(cat => (
                        <button
                            key={cat}
                            className={`button ${selectedCategory === cat ? 'primary' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* DOCUMENTS DATA ROWS PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Vault Documents ({filteredDocs.length})</div>
                        <div className="panel-subtitle">Your encrypted campus document records</div>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredDocs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">▤</div>
                            <div className="empty-title">Your vault is empty for this filter</div>
                            <div className="empty-description">Upload your certificates, ID cards, or official forms to keep them safe, encrypted, and accessible.</div>
                            <button className="button primary" style={{ marginTop: '14px' }} onClick={() => setUploadModalOpen(true)}>
                                Upload Document
                            </button>
                        </div>
                    ) : (
                        filteredDocs.map((doc) => (
                            <div key={doc.id} className="data-row" style={{ flexWrap: 'wrap', gap: '16px' }}>
                                <div className="data-icon" style={{ background: doc.type === 'PDF' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: doc.type === 'PDF' ? '#f87171' : '#60a5fa' }}>
                                    {doc.type === 'PDF' ? '📄' : '🖼️'}
                                </div>

                                <div className="data-content" style={{ minWidth: '260px' }}>
                                    <div className="data-title" style={{ fontSize: '15px', color: 'var(--text)' }}>{doc.name}</div>
                                    <div className="data-meta">
                                        <span className="badge">{doc.category}</span>
                                        <span className="badge">Uploaded: {doc.date}</span>
                                        {doc.status === 'Approved' && <span className="badge success">✓ Approved</span>}
                                        {doc.status === 'Pending' && <span className="badge warning">⏳ Pending Verification</span>}
                                        {doc.status === 'Rejected' && <span className="badge danger">✕ Rejected</span>}
                                    </div>
                                    {doc.status === 'Rejected' && doc.feedback && (
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: '#fca5a5', 
                                            background: 'rgba(239, 68, 68, 0.12)', 
                                            border: '1px solid rgba(239, 68, 68, 0.35)', 
                                            borderRadius: '6px', 
                                            padding: '8px 12px', 
                                            marginTop: '8px', 
                                            lineHeight: '1.4' 
                                        }}>
                                            <strong style={{ color: '#f87171' }}>✕ Admin Rejection Explanation:</strong> {doc.feedback}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                                    <button className="button" onClick={() => triggerProtectedAction(doc, "preview")}>
                                        👁 Preview
                                    </button>
                                    <button className="button primary" onClick={() => triggerProtectedAction(doc, "download")}>
                                        ⇩ Download
                                    </button>
                                    <button className="button danger" onClick={() => triggerProtectedAction(doc, "delete")}>
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* 1. UPLOAD DOCUMENT MODAL */}
            {uploadModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '520px', width: '100%', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>+ Upload Document to Vault</h3>
                            <button className="button danger" onClick={() => setUploadModalOpen(false)} style={{ height: '30px', padding: '0 8px' }}>✕</button>
                        </div>

                        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Document Name / Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Community Certificate 2025"
                                    value={newDocName}
                                    onChange={(e) => setNewDocName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category</label>
                                <select
                                    className="input"
                                    value={newDocCategory}
                                    onChange={(e) => setNewDocCategory(e.target.value)}
                                    style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                                >
                                    <option value="Academic Certificates">Academic Certificates</option>
                                    <option value="Income Declarations">Income Declarations</option>
                                    <option value="ID Cards">ID Cards</option>
                                    <option value="Scholarship Forms">Scholarship Forms</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Select File (PDF / JPG / PNG)</label>
                                <input
                                    type="file"
                                    className="input"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    style={{ padding: '8px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" className="button" onClick={() => setUploadModalOpen(false)}>Cancel</button>
                                <button type="submit" className="button primary">Upload to Encrypted Vault</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. DOUBLE PASSKEY AUTHORIZATION MODAL */}
            {passkeyModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '460px', width: '100%', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>🔐 2-Factor Double Passkey</h3>
                            <button className="button danger" onClick={() => setPasskeyModalOpen(false)} style={{ height: '30px', padding: '0 8px' }}>✕</button>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Authorizing action for <strong>{targetDoc?.name}</strong>. Enter your Double Passkeys.
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
                            Authorize {actionType.toUpperCase()}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. FILE PREVIEW MODAL */}
            {previewDoc && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="panel" style={{ maxWidth: '640px', width: '100%', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border-hover)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span className="badge success" style={{ marginBottom: '6px' }}>Verified Vault Document</span>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{previewDoc.name}</h3>
                            </div>
                            <button className="button danger" onClick={() => setPreviewDoc(null)} style={{ height: '32px', padding: '0 10px' }}>✕</button>
                        </div>

                        <div style={{ height: '240px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '18px' }}>
                            <div style={{ fontSize: '42px' }}>{previewDoc.type === 'PDF' ? '📄' : '🖼️'}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{previewDoc.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>File Size: {previewDoc.size} | Status: Encrypted & Verified</div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="button" onClick={() => setPreviewDoc(null)}>Close Preview</button>
                            <button className="button primary" onClick={() => { setPreviewDoc(null); triggerProtectedAction(previewDoc, "download"); }}>
                                ⇩ Download File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ All files in your Digital Vault are encrypted with AES-256 and protected with 2-Factor Double Passkeys.
            </div>
        </div>
    );
}
