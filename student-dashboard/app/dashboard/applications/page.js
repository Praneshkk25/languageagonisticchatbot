"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiBaseUrl, getFileUrl } from "@/lib/api";

export default function StudentApplicationsPage() {
    const [student, setStudent] = useState(null);
    const [applications, setApplications] = useState([]);
    const [availableScholarships, setAvailableScholarships] = useState([]);
    const [walletDocuments, setWalletDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Application Form state
    const [selectedSchId, setSelectedSchId] = useState("");
    const [appliedAmount, setAppliedAmount] = useState("₹50,000");
    const [studentRemarks, setStudentRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedDocsMap, setSelectedDocsMap] = useState({}); // { doc_name: { source: 'wallet'|'upload', file_path, file_name, ... } }
    const [customDocsList, setCustomDocsList] = useState([]); // [{ document_name, category, file_path, file_name, reason, remarks }]
    
    // Custom Document Sub-Modal
    const [customModalOpen, setCustomModalOpen] = useState(false);
    const [customDocForm, setCustomDocForm] = useState({
        document_name: "",
        category: "Supporting Proof",
        reason: "",
        remarks: "",
        file: null,
        file_path: "",
        file_name: ""
    });
    const [customUploading, setCustomUploading] = useState(false);

    // Resubmit / Correction Modal
    const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
    const [resubmitTarget, setResubmitTarget] = useState(null); // { appId, doc }
    const [resubmitFile, setResubmitFile] = useState(null);
    const [resubmitRemarks, setResubmitRemarks] = useState("");
    const [resubmitting, setResubmitting] = useState(false);

    // Document Version History Modal
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyTargetDoc, setHistoryTargetDoc] = useState(null);

    // Missing document later submission toggle
    const [allowMissingSubmission, setAllowMissingSubmission] = useState(false);

    // Official Receipt Modal state
    const [receiptModalApp, setReceiptModalApp] = useState(null);

    useEffect(() => {
        let currentStudent = null;
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    currentStudent = JSON.parse(userStr);
                    setStudent(currentStudent);
                } catch (e) {}
            }

            const urlParams = new URLSearchParams(window.location.search);
            const applyId = urlParams.get("apply_id");
            if (applyId) {
                setSelectedSchId(applyId);
                setApplyModalOpen(true);
            }
        }

        const studentId = currentStudent?.id || "23CSEBE274";
        fetchStudentApplications(studentId);
        fetchScholarships();
        fetchWalletDocuments(studentId);

        const handleVisibilityAndPoll = () => {
            if (!document.hidden && studentId) {
                fetchStudentApplications(studentId);
                fetchWalletDocuments(studentId);
            }
        };

        const interval = setInterval(handleVisibilityAndPoll, 35000);
        document.addEventListener("visibilitychange", handleVisibilityAndPoll);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityAndPoll);
        };
    }, []);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(""), 6000);
    };

    const fetchStudentApplications = async (studentId) => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/student/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setApplications(data);
                }
            }
        } catch (e) {
            console.error("Error fetching applications:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchScholarships = async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/scholarships/all`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAvailableScholarships(data);
                    if (data.length > 0 && !selectedSchId) {
                        setSelectedSchId(data[0].id);
                        if (data[0].benefits) setAppliedAmount(data[0].benefits);
                    }
                }
            }
        } catch (e) {}
    };

    const fetchWalletDocuments = async (studentId) => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/documents/student/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setWalletDocuments(data);
                }
            }
        } catch (e) {}
    };

    const activeScholarship = availableScholarships.find(s => String(s.id) === String(selectedSchId)) || availableScholarships[0];

    // Determine required & optional documents for selected scholarship
    const getRequiredDocsForScholarship = (sch) => {
        if (!sch) return [
            { name: "Aadhaar Card", category: "Identity Proof", required: true },
            { name: "Annual Family Income Certificate", category: "Income Proof", required: true },
            { name: "Marksheet Transcripts (10th/12th/Semester)", category: "Academic Proof", required: true },
            { name: "College Bonafide Certificate", category: "Institutional Proof", required: true },
            { name: "Student Bank Account Passbook", category: "Bank Details", required: true },
            { name: "Community / Caste Certificate", category: "Category Proof", required: false },
            { name: "Passport-size Photograph", category: "Photo Proof", required: false }
        ];

        let baseDocs = [
            { name: "Aadhaar Card", category: "Identity Proof", required: true },
            { name: "Annual Family Income Certificate", category: "Income Proof", required: true },
            { name: "Marksheet Transcripts", category: "Academic Proof", required: true },
            { name: "College Bonafide Certificate", category: "Institutional Proof", required: true },
            { name: "Student Bank Account Passbook", category: "Bank Details", required: true }
        ];

        const nameLower = (sch.scholarship_name || "").toLowerCase();
        const catLower = (sch.category_name || "").toLowerCase();

        if (catLower.includes("disability") || nameLower.includes("disability") || nameLower.includes("pwd")) {
            baseDocs.push({ name: "Disability Certificate (PwD)", category: "Medical Proof", required: true });
        }
        if (catLower.includes("minority") || catLower.includes("sc/st") || catLower.includes("caste") || nameLower.includes("community")) {
            baseDocs.push({ name: "Community / Caste Certificate", category: "Category Proof", required: true });
        }
        if (nameLower.includes("hostel")) {
            baseDocs.push({ name: "Hostel Stay Certificate", category: "Hostel Proof", required: true });
        }
        if (nameLower.includes("sports")) {
            baseDocs.push({ name: "Sports Achievement Certificate", category: "Sports Proof", required: true });
        }
        
        baseDocs.push({ name: "Passport-size Photograph", category: "Photo Proof", required: false });
        return baseDocs;
    };

    const currentDocRequirements = getRequiredDocsForScholarship(activeScholarship);

    // Handle document upload directly for a specific requirement
    const handleDocumentFileUpload = async (docName, file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${getApiBaseUrl()}/api/applications/upload-document`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedDocsMap(prev => ({
                    ...prev,
                    [docName]: {
                        document_name: docName,
                        source: "upload",
                        file_path: data.file_path,
                        file_name: data.file_name,
                        upload_timestamp: new Date().toISOString()
                    }
                }));
                showToast(`✓ Document uploaded for '${docName}'`);
            } else {
                alert(`Upload failed: ${data.detail || 'Error'}`);
            }
        } catch (e) {
            console.error("Doc upload error:", e);
            alert("Error uploading document to server.");
        }
    };

    // Handle Custom Document Addition
    const handleAddCustomDocument = async (e) => {
        e.preventDefault();
        if (!customDocForm.document_name.trim()) {
            alert("Please enter custom document title.");
            return;
        }
        if (!customDocForm.file && !customDocForm.file_path) {
            alert("Please select a file to upload.");
            return;
        }
        if (!customDocForm.reason.trim()) {
            alert("Please state the reason for submitting this supporting document.");
            return;
        }

        setCustomUploading(true);
        try {
            let finalFilePath = customDocForm.file_path;
            let finalFileName = customDocForm.file_name || customDocForm.file?.name;

            if (customDocForm.file && !finalFilePath) {
                const formData = new FormData();
                formData.append("file", customDocForm.file);
                const res = await fetch(`${getApiBaseUrl()}/api/applications/upload-document`, {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    finalFilePath = data.file_path;
                    finalFileName = data.file_name;
                } else {
                    alert(`Upload failed: ${data.detail || 'Error'}`);
                    return;
                }
            }

            const newCustomItem = {
                id: `custom_${Date.now()}`,
                document_name: customDocForm.document_name.trim(),
                category: customDocForm.category,
                file_path: finalFilePath,
                file_name: finalFileName,
                reason: customDocForm.reason.trim(),
                remarks: customDocForm.remarks.trim(),
                status: "Pending Verification",
                required: false,
                source: "upload",
                version: 1
            };

            setCustomDocsList(prev => [...prev, newCustomItem]);
            setCustomModalOpen(false);
            setCustomDocForm({
                document_name: "",
                category: "Supporting Proof",
                reason: "",
                remarks: "",
                file: null,
                file_path: "",
                file_name: ""
            });
            showToast(`✓ Custom document '${newCustomItem.document_name}' added to submission checklist!`);
        } catch (e) {
            console.error("Custom doc error:", e);
            alert("Error attaching custom document.");
        } finally {
            setCustomUploading(false);
        }
    };

    // Main Application Submission Handler
    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!selectedSchId) {
            alert("Please select a scholarship scheme.");
            return;
        }

        const sch = availableScholarships.find(s => String(s.id) === String(selectedSchId)) || activeScholarship;
        const requiredDocs = currentDocRequirements.filter(d => d.required);
        const missingRequired = requiredDocs.filter(d => !selectedDocsMap[d.name]);

        if (missingRequired.length > 0 && !allowMissingSubmission) {
            alert(`⚠️ Required document(s) missing:\n- ${missingRequired.map(d => d.name).join("\n- ")}\n\nPlease attach all required documents or check 'Missing Document — To Be Submitted Later'.`);
            return;
        }

        const studentId = student?.id || "23CSEBE274";
        const studentName = student?.name || "PRANESH K K";

        // Build structured documents array
        const documentsPayload = [];
        currentDocRequirements.forEach(reqDoc => {
            const attached = selectedDocsMap[reqDoc.name];
            if (attached) {
                documentsPayload.push({
                    document_name: reqDoc.name,
                    category: reqDoc.category,
                    source: attached.source || "upload",
                    file_path: attached.file_path,
                    file_name: attached.file_name,
                    required: reqDoc.required,
                    status: "Pending Verification", // Uploaded != Verified
                    version: 1
                });
            }
        });

        // Add custom documents
        customDocsList.forEach(cd => {
            documentsPayload.push({
                document_name: cd.document_name,
                category: cd.category,
                source: "upload",
                file_path: cd.file_path,
                file_name: cd.file_name,
                required: false,
                status: "Pending Verification",
                student_remarks: `Reason: ${cd.reason}. ${cd.remarks || ''}`,
                version: 1
            });
        });

        const missingNames = missingRequired.map(d => d.name);

        setSubmitting(true);
        try {
            const payload = {
                scholarship_id: String(selectedSchId),
                scholarship_name: sch?.scholarship_name || "Higher Education Scholarship",
                category_name: sch?.category_name || "General Scholarship",
                application_mode: sch?.application_mode || "Online",
                student_id: studentId,
                student_name: studentName,
                department: student?.department || "CSE",
                year: student?.year || 3,
                cgpa: student?.cgpa || 8.5,
                family_income: student?.family_income || 250000.0,
                applied_amount: appliedAmount,
                bank_account_no: student?.bank_account_no || "987654321012",
                bank_name: student?.bank_name || "State Bank of India",
                ifsc_code: student?.ifsc_code || "SBIN0001234",
                first_generation_graduate: student?.first_generation_graduate || "No",
                caste_category: student?.caste_category || "General",
                student_remarks: studentRemarks,
                documents: documentsPayload,
                custom_documents: customDocsList,
                missing_documents: missingNames
            };

            const res = await fetch(`${getApiBaseUrl()}/api/applications/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                showToast("✓ Scholarship Application submitted successfully! All documents are queued for Admin Verification.");
                setApplyModalOpen(false);
                setStudentRemarks("");
                setSelectedDocsMap({});
                setCustomDocsList([]);
                setAllowMissingSubmission(false);
                fetchStudentApplications(studentId);
            } else {
                alert(`Submission failed: ${data.detail || "Error submitting application."}`);
            }
        } catch (e) {
            console.error("Submission error:", e);
            alert("Network error. Please check backend connection.");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Resubmission of Corrected Document
    const handleResubmitSubmit = async (e) => {
        e.preventDefault();
        if (!resubmitTarget || !resubmitFile) {
            alert("Please choose a replacement document file.");
            return;
        }

        setResubmitting(true);
        try {
            // Upload file first
            const formData = new FormData();
            formData.append("file", resubmitFile);
            const uploadRes = await fetch(`${getApiBaseUrl()}/api/applications/upload-document`, {
                method: "POST",
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) {
                alert(`File upload failed: ${uploadData.detail || 'Error'}`);
                return;
            }

            const payload = {
                file_path: uploadData.file_path,
                file_name: uploadData.file_name,
                student_remarks: resubmitRemarks.trim() || "Uploaded corrected version as requested by admin."
            };

            const docId = resubmitTarget.doc.id || resubmitTarget.doc.document_name;
            const res = await fetch(`${getApiBaseUrl()}/api/applications/${resubmitTarget.appId}/document/${encodeURIComponent(docId)}/resubmit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`✓ Version ${(resubmitTarget.doc.version || 1) + 1} of '${resubmitTarget.doc.document_name}' submitted for re-verification!`);
                setResubmitModalOpen(false);
                setResubmitTarget(null);
                setResubmitFile(null);
                setResubmitRemarks("");
                const studentId = student?.id || "23CSEBE274";
                fetchStudentApplications(studentId);
            } else {
                alert(`Resubmission failed: ${data.detail || 'Error'}`);
            }
        } catch (e) {
            console.error("Resubmission error:", e);
            alert("Error resubmitting document.");
        } finally {
            setResubmitting(false);
        }
    };

    const handleConfirmHardcopySubmit = async (appId) => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/${appId}/hardcopy-submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: student?.id || "23CSEBE274",
                    office_room: "College Scholarship Cell, Room #102",
                    remarks: "Submitted attested photocopies with originals verified."
                })
            });
            if (res.ok) {
                showToast("✓ Physical hardcopy submission recorded! Office administrator will inspect and verify your documents.");
                const studentId = student?.id || "23CSEBE274";
                fetchStudentApplications(studentId);
            } else {
                alert("Failed to record hardcopy submission.");
            }
        } catch (e) {
            console.error("Hardcopy confirm error:", e);
            alert("Error recording hardcopy submission.");
        }
    };

    const filteredApps = applications.filter(app => {
        if (selectedFilter === "All") return true;
        if (selectedFilter === "In Progress") return app.stage < 4 && !app.status?.includes("Rejected");
        if (selectedFilter === "Approved") return app.status === "Approved" || (app.stage === 4 && !app.status?.includes("Rejected"));
        if (selectedFilter === "Rejected") return app.status?.includes("Rejected");
        if (selectedFilter === "Correction Required") return app.status === "Correction Required" || (app.documents || []).some(d => d.status === "Correction Required");
        if (selectedFilter === "Disbursed") return app.stage === 5 || app.status === "Amount Received";
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge success" style={{ marginBottom: '12px' }}>⚡ Scholarship Applications & Document Verification</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Scholarship Applications & Verification Tracking
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '850px', marginBottom: '16px' }}>
                    Track your submitted scholarship applications, review verification progress per document, attach supporting proofs, and re-upload corrected documents directly. Every submitted document undergoes independent administrative verification.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge">{applications.length} Submitted Applications</span>
                    <span className="badge success">🟢 Live Verification Sync</span>
                    <button 
                        className="button primary" 
                        onClick={() => {
                            if (availableScholarships.length > 0 && !selectedSchId) {
                                setSelectedSchId(availableScholarships[0].id);
                            }
                            setApplyModalOpen(true);
                        }}
                        style={{ marginLeft: 'auto' }}
                    >
                        + Apply for New Scholarship
                    </button>
                </div>
            </section>

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    {toastMessage}
                </div>
            )}

            {/* STATUS FILTER BUTTONS */}
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '8px' }}>
                {["All", "In Progress", "Correction Required", "Approved", "Disbursed", "Rejected"].map(filter => (
                    <button
                        key={filter}
                        className={`button ${selectedFilter === filter ? 'primary' : ''}`}
                        onClick={() => setSelectedFilter(filter)}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* APPLICATIONS LIST */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">My Applications ({filteredApps.length})</div>
                        <div className="panel-subtitle">Independent Document Status & Lifecycle Progress</div>
                    </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading your applications...
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎓</div>
                            <div className="empty-title">No scholarship applications found</div>
                            <div className="empty-description">
                                You haven't submitted any scholarship applications yet. Explore available schemes and submit your application with required verification documents.
                            </div>
                            <button className="button primary" style={{ marginTop: '16px' }} onClick={() => setApplyModalOpen(true)}>
                                Apply for Scholarship Now
                            </button>
                        </div>
                    ) : (
                        filteredApps.map((app) => {
                            const isRejected = app.status?.includes("Rejected");
                            const isApproved = app.status === "Approved";
                            const isDisbursed = app.stage === 5 || app.status === "Amount Received";
                            const documents = app.documents || [];
                            const physicalChecklist = app.physical_checklist || [];

                            const totalDocs = documents.length;
                            const verifiedDocs = documents.filter(d => d.status === "Verified").length;
                            const correctionDocs = documents.filter(d => d.status === "Correction Required").length;

                            return (
                                <div 
                                    key={app.id}
                                    style={{
                                        background: 'var(--surface)',
                                        border: isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : (isDisbursed ? '1px solid rgba(16, 185, 129, 0.5)' : (isApproved ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border)')),
                                        borderRadius: '16px',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    {/* APPLICATION HEADER */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                <span className="badge primary">#{app.id}</span>
                                                <span className="badge">{app.category_name || 'Scholarship Scheme'}</span>
                                                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                                    🌐 Mode: {app.application_mode || 'Online'}
                                                </span>
                                                {isRejected ? (
                                                    <span className="badge danger">✕ {app.status}</span>
                                                ) : isDisbursed ? (
                                                    <span className="badge success" style={{ background: '#10b981', color: '#fff' }}>💰 Amount Credited</span>
                                                ) : isApproved ? (
                                                    <span className="badge success">✓ Approved</span>
                                                ) : correctionDocs > 0 ? (
                                                    <span className="badge warning" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
                                                        ⚠️ Action Required: Correction Needed
                                                    </span>
                                                ) : (
                                                    <span className="badge warning">⏳ {app.status}</span>
                                                )}
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>
                                                {app.scholarship_name}
                                            </h3>
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sanctioned / Applied Grant</div>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: isDisbursed ? 'var(--success)' : '#c084fc' }}>
                                                {app.disbursed_amount || app.applied_amount || '₹50,000'}
                                            </div>
                                            <button
                                                type="button"
                                                className="button"
                                                onClick={() => setReceiptModalApp(app)}
                                                style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
                                                title="View and download printable official submission receipt"
                                            >
                                                <span>📄</span>
                                                <span>Download Receipt</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 6-STAGE COMPLETE LIFECYCLE TIMELINE */}
                                    <div style={{ background: 'var(--surface-2)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            6-Stage Application & Verification Pipeline:
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                            {[
                                                { num: 1, label: "Submitted", icon: "📝", desc: "Application received" },
                                                { num: 2, label: "Docs Verified", icon: "🔍", desc: "Certificates verified" },
                                                { num: 3, label: "Processed & Signed", icon: "✍️", desc: "Institutional sign" },
                                                { num: 4, label: "Submitted to Govt", icon: "🏛️", desc: "NSP portal upload" },
                                                { num: 5, label: "Govt Decision", icon: "⚖️", desc: "Award sanctioned" },
                                                { num: 6, label: "Amount Received", icon: "💰", desc: "DBT bank credit" },
                                            ].map((stg) => {
                                                // Compute stage completion
                                                let appStageNum = 1;
                                                if (app.status === "Amount Received" || app.stage === 5) appStageNum = 6;
                                                else if (app.status === "Approved" || app.status === "Government Approved") appStageNum = 5;
                                                else if (app.status?.includes("Rejected")) appStageNum = 5;
                                                else if (app.status === "Submitted to Government") appStageNum = 4;
                                                else if (app.status === "Processed & Signed") appStageNum = 3;
                                                else if (app.status === "Documents Verified" || (totalDocs > 0 && verifiedDocs === totalDocs)) appStageNum = 2;
                                                else appStageNum = 1;

                                                const isCompleted = appStageNum > stg.num || (appStageNum === stg.num && !isRejected);
                                                const isCurrent = appStageNum === stg.num;
                                                const isStageRejected = isRejected && stg.num === 5;

                                                let statusColor = '#707b98';
                                                let bgColor = 'rgba(255, 255, 255, 0.02)';
                                                let borderColor = 'rgba(255, 255, 255, 0.08)';

                                                if (isStageRejected) {
                                                    statusColor = '#f87171';
                                                    bgColor = 'rgba(239, 68, 68, 0.15)';
                                                    borderColor = '#ef4444';
                                                } else if (isCompleted) {
                                                    statusColor = 'var(--success)';
                                                    bgColor = 'rgba(66, 214, 164, 0.12)';
                                                    borderColor = 'var(--success)';
                                                } else if (isCurrent) {
                                                    statusColor = '#c084fc';
                                                    bgColor = 'rgba(168, 85, 247, 0.15)';
                                                    borderColor = '#c084fc';
                                                }

                                                return (
                                                    <div 
                                                        key={stg.num}
                                                        style={{
                                                            padding: '12px',
                                                            borderRadius: '10px',
                                                            background: bgColor,
                                                            border: `1px solid ${borderColor}`,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '16px' }}>{stg.icon}</span>
                                                            <span style={{ fontSize: '9px', fontWeight: 800, color: statusColor }}>
                                                                {isStageRejected ? 'REJECTED' : (isCompleted ? '✓ DONE' : (isCurrent ? '● ACTIVE' : 'PENDING'))}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                                                            {stg.num}. {stg.label}
                                                        </div>
                                                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                                                            {stg.desc}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* VERIFICATION PROGRESS BAR */}
                                    {totalDocs > 0 && (
                                        <div style={{ background: '#081229', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                                    Document Verification Progress: {verifiedDocs} of {totalDocs} Verified
                                                </span>
                                                <span style={{ fontSize: '12px', fontWeight: 800, color: verifiedDocs === totalDocs ? 'var(--success)' : '#38bdf8' }}>
                                                    {Math.round((verifiedDocs / totalDocs) * 100)}%
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div 
                                                    style={{ 
                                                        width: `${(verifiedDocs / totalDocs) * 100}%`, 
                                                        height: '100%', 
                                                        background: verifiedDocs === totalDocs ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                                                        borderRadius: '4px',
                                                        transition: 'width 0.4s ease'
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBMITTED DOCUMENTS SECTION (Uploaded != Verified) */}
                                    <div style={{ background: '#081229', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                                                    📄 Submitted Application Documents
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    Uploaded ≠ Verified: Documents are reviewed individually by the scholarship administrator.
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                                            {documents.map((doc, idx) => {
                                                const isDocVerified = doc.status === "Verified";
                                                const isDocRejected = doc.status === "Rejected";
                                                const isDocCorrection = doc.status === "Correction Required";
                                                const isDocOffline = doc.status === "Offline Required";

                                                let statusBadge = (
                                                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
                                                        ⏳ Pending Verification
                                                    </span>
                                                );

                                                if (isDocVerified) {
                                                    statusBadge = (
                                                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                                                            ✓ Verified
                                                        </span>
                                                    );
                                                } else if (isDocCorrection) {
                                                    statusBadge = (
                                                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b', fontWeight: 800 }}>
                                                            ⚠️ Correction Required
                                                        </span>
                                                    );
                                                } else if (isDocRejected) {
                                                    statusBadge = (
                                                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 }}>
                                                            ✕ Rejected
                                                        </span>
                                                    );
                                                } else if (isDocOffline) {
                                                    statusBadge = (
                                                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 700 }}>
                                                            🏛️ Physical Copy Required
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <div 
                                                        key={doc.id || idx}
                                                        style={{
                                                            background: isDocCorrection ? 'rgba(245, 158, 11, 0.05)' : '#0d1a38',
                                                            border: isDocCorrection ? '1px solid rgba(245, 158, 11, 0.4)' : (isDocVerified ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)'),
                                                            borderRadius: '10px',
                                                            padding: '14px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                                                                {doc.document_name}
                                                            </div>
                                                            {statusBadge}
                                                        </div>

                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                            <span>📦 Source: <strong>{doc.source === 'wallet' ? 'Digital Wallet' : 'New Upload'}</strong></span>
                                                            <span>🏷️ Version {doc.version || 1}</span>
                                                            {doc.category && <span>📂 {doc.category}</span>}
                                                        </div>

                                                        {doc.admin_remarks && (
                                                            <div style={{ fontSize: '11px', color: isDocCorrection ? '#fbbf24' : '#c084fc', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                                                                <strong>Admin Note:</strong> {doc.admin_remarks}
                                                            </div>
                                                        )}

                                                        {doc.rejection_reason && (
                                                            <div style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                                                                <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                                            {doc.file_path && (
                                                                <a 
                                                                    href={getFileUrl(doc.file_path)} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="button secondary"
                                                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                                                >
                                                                    👁️ View File
                                                                </a>
                                                            )}

                                                            {(doc.version_history && doc.version_history.length > 1) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setHistoryTargetDoc(doc);
                                                                        setHistoryModalOpen(true);
                                                                    }}
                                                                    className="button secondary"
                                                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                                                >
                                                                    📜 History ({doc.version_history.length})
                                                                </button>
                                                            )}

                                                            {isDocCorrection && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setResubmitTarget({ appId: app.id, doc });
                                                                        setResubmitRemarks("");
                                                                        setResubmitFile(null);
                                                                        setResubmitModalOpen(true);
                                                                    }}
                                                                    className="button primary"
                                                                    style={{ fontSize: '11px', padding: '4px 12px', background: '#f59e0b', border: '1px solid #d97706' }}
                                                                >
                                                                    📤 Re-upload Corrected File
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* PHYSICAL DOCUMENT CHECKLIST (If Offline / Hybrid) */}
                                    {(physicalChecklist.length > 0 || app.application_mode === "Offline" || app.application_mode === "Hybrid" || app.hardcopy_required) && (
                                        <div style={{ background: '#081229', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>🏛️ Physical Hardcopy Submission Status</span>
                                                    <span className="badge" style={{ background: app.hardcopy_verified ? 'rgba(16, 185, 129, 0.2)' : (app.hardcopy_submitted ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)'), color: app.hardcopy_verified ? '#10b981' : (app.hardcopy_submitted ? '#38bdf8' : '#f59e0b') }}>
                                                        {app.hardcopy_verified ? '✓ Hardcopy Verified by Admin' : (app.hardcopy_submitted ? '⏳ Hardcopy Handed Over (Pending Office Check)' : '⚠️ Hardcopy Submission Pending')}
                                                    </span>
                                                </div>

                                                {!app.hardcopy_verified && !app.hardcopy_submitted && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleConfirmHardcopySubmit(app.id)}
                                                        className="button primary"
                                                        style={{ fontSize: '11px', padding: '4px 12px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', fontWeight: 800 }}
                                                    >
                                                        📑 I have submitted Hardcopy to Scholarship Cell
                                                    </button>
                                                )}
                                            </div>

                                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                                Venue: <strong>College Scholarship Verification Cell (Admin Block Room 102)</strong>. Submit attested photocopies along with original certificates for verification.
                                            </p>

                                            {physicalChecklist.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                                                    {physicalChecklist.map((item, pIdx) => {
                                                        const isPhysVerified = item.status === "Verified" || app.hardcopy_verified;
                                                        const isPhysReceived = item.status === "Received" || item.status === "Checked" || app.hardcopy_submitted;

                                                        return (
                                                            <div key={item.id || pIdx} style={{ background: '#0d1a38', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                                                                    {item.document_name}
                                                                </div>
                                                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: isPhysVerified ? 'rgba(16,185,129,0.2)' : (isPhysReceived ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)'), color: isPhysVerified ? '#10b981' : (isPhysReceived ? '#38bdf8' : 'var(--text-muted)') }}>
                                                                    {isPhysVerified ? 'Verified' : (isPhysReceived ? 'Received / In Review' : (item.status || 'Not Received'))}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STUDENT BANK & OFFICER REMARKS */}
                                    <div style={{ background: '#081229', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Student Name & Roll ID</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                                                {app.student_name} ({app.student_id})
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DBT Bank Account</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fb923c' }}>
                                                {app.bank_name || 'State Bank of India'} (A/C: {app.bank_account_no || '987654321012'})
                                            </div>
                                        </div>

                                        {app.govt_portal_id && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Govt Portal Reference ID</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                                                    {app.govt_portal_id}
                                                </div>
                                            </div>
                                        )}

                                        {app.transaction_ref && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank UTR / Transaction ID</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                                                    {app.transaction_ref} (Credited: {app.disbursement_date || 'Today'})
                                                </div>
                                            </div>
                                        )}

                                        {app.officer_notes && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Institutional Verification Note:</div>
                                                <div style={{ fontSize: '13px', color: '#c084fc', fontWeight: 600, marginTop: '2px' }}>
                                                    ✍️ {app.officer_notes}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* MULTI-STEP APPLY FOR SCHOLARSHIP MODAL */}
            {applyModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-hover)', borderRadius: '20px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* MODAL HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                            <div>
                                <span className="badge primary">Step-by-Step Scholarship Application</span>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginTop: '6px' }}>
                                    Apply for Scholarship & Submit Verification Documents
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Select documents from your <strong>Digital Wallet</strong> or upload fresh files. Every document starts as <strong>Pending Verification</strong>.
                                </p>
                            </div>
                            <button 
                                onClick={() => setApplyModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* STEP 1: SCHOLARSHIP SELECTION & DETAILS */}
                            <div style={{ background: 'var(--surface-2)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px' }}>
                                    1. Scholarship Details & Mode
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                             Select Scholarship Scheme *
                                        </label>
                                        <select 
                                            value={selectedSchId} 
                                            onChange={(e) => {
                                                setSelectedSchId(e.target.value);
                                                const s = availableScholarships.find(x => String(x.id) === String(e.target.value));
                                                if (s && s.benefits) setAppliedAmount(s.benefits);
                                            }}
                                            style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                                        >
                                            {availableScholarships.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.scholarship_name} ({s.category_name || 'General'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                            Application Mode
                                        </label>
                                        <div style={{ padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                                            🌐 {activeScholarship?.application_mode || 'Online Application'}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                            Scholarship Benefit / Grant
                                        </label>
                                        <input 
                                            type="text" 
                                            value={appliedAmount} 
                                            onChange={(e) => setAppliedAmount(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>

                                {activeScholarship && (
                                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                                        <strong>Eligibility:</strong> {activeScholarship.eligibility || 'Check institutional eligibility guidelines.'} | <strong>Deadline:</strong> {activeScholarship.deadline || '31 Dec 2026'}
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: DYNAMIC REQUIRED & OPTIONAL DOCUMENTS */}
                            <div style={{ background: '#081229', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                                            2. Required & Supporting Documents Checklist
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Pick from your reusable <strong>Digital Wallet</strong> or upload new certificate files.
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setCustomModalOpen(true)}
                                        className="button secondary"
                                        style={{ fontSize: '11px', padding: '6px 12px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                                    >
                                        + Document Not Listed? Add Other
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {currentDocRequirements.map((reqDoc, idx) => {
                                        const attached = selectedDocsMap[reqDoc.name];

                                        return (
                                            <div 
                                                key={idx}
                                                style={{
                                                    background: attached ? 'rgba(16, 185, 129, 0.05)' : '#0a142b',
                                                    border: attached ? '1px solid rgba(16, 185, 129, 0.3)' : (reqDoc.required ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)'),
                                                    borderRadius: '10px',
                                                    padding: '14px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                                                            {reqDoc.name}
                                                        </span>
                                                        {reqDoc.required ? (
                                                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                                                                * Required
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                                                                Optional
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        Initial Status: <strong style={{ color: '#38bdf8' }}>Pending Verification</strong>
                                                    </span>
                                                </div>

                                                {/* PICKER: WALLET OR UPLOAD */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', alignItems: 'center' }}>
                                                    <div>
                                                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                                            Option A: Choose from Digital Wallet
                                                        </label>
                                                        <select
                                                            onChange={(e) => handleSelectFromWallet(reqDoc.name, e.target.value)}
                                                            style={{ width: '100%', padding: '8px', background: '#081229', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                                                        >
                                                            <option value="">-- Select from Wallet --</option>
                                                            {walletDocuments.map(w => (
                                                                <option key={w.id} value={w.id}>
                                                                    📁 {w.document_type || w.filename}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                                            Option B: Upload New Document
                                                        </label>
                                                        <input 
                                                            type="file" 
                                                            onChange={(e) => handleDocumentFileUpload(reqDoc.name, e.target.files?.[0])}
                                                            style={{ width: '100%', fontSize: '11px', color: 'var(--text-secondary)' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* ATTACHMENT CONFIRMATION BADGE */}
                                                {attached && (
                                                    <div style={{ fontSize: '11px', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '6px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>✓ Attached: <strong>{attached.file_name}</strong> (Source: {attached.source === 'wallet' ? 'Digital Wallet' : 'New Upload'})</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setSelectedDocsMap(prev => { const n = {...prev}; delete n[reqDoc.name]; return n; })}
                                                            style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
                                                        >
                                                            ✕ Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* DISPLAY CUSTOM ATTACHED DOCUMENTS */}
                                    {customDocsList.length > 0 && (
                                        <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', marginBottom: '8px' }}>
                                                Custom Supporting Documents ({customDocsList.length})
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {customDocsList.map((cd, cIdx) => (
                                                    <div key={cd.id || cIdx} style={{ background: '#0d1a38', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                                                {cd.document_name} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({cd.category})</span>
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                                Reason: {cd.reason} | File: {cd.file_name}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setCustomDocsList(prev => prev.filter((_, i) => i !== cIdx))}
                                                            style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* STEP 3: SUBMISSION REMARKS & CONFIRMATION */}
                            <div style={{ background: '#081229', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
                                    3. Student Remarks & Missing Document Exception
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                        Additional Remarks or Clarifications for Admin (Optional)
                                    </label>
                                    <textarea 
                                        rows={2} 
                                        placeholder="Add any special circumstances, income details, or document clarification..."
                                        value={studentRemarks} 
                                        onChange={(e) => setStudentRemarks(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#0a142b', border: '1px solid var(--border)', borderRadius: '8px', color: '#ffffff', fontSize: '13px' }}
                                    />
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={allowMissingSubmission} 
                                        onChange={(e) => setAllowMissingSubmission(e.target.checked)}
                                    />
                                    <span>Allow submission with <strong>Missing Document — To Be Submitted Later</strong> (Admin approval required).</span>
                                </label>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" 
                                    className="button secondary" 
                                    onClick={() => setApplyModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="button primary" 
                                    disabled={submitting}
                                >
                                    {submitting ? "Submitting Application & Documents..." : "Submit Application for Verification →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* "+ ADD OTHER DOCUMENT" CUSTOM MODAL */}
            {customModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>
                                📄 Add Other Supporting Document
                            </h3>
                            <button onClick={() => setCustomModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <form onSubmit={handleAddCustomDocSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Document Name * (e.g. Disability Certificate, Sports Certificate)
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Enter Document Name" 
                                    value={customDocForm.document_name}
                                    onChange={(e) => setCustomDocForm({...customDocForm, document_name: e.target.value})}
                                    style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Document Category
                                </label>
                                <select
                                    value={customDocForm.category}
                                    onChange={(e) => setCustomDocForm({...customDocForm, category: e.target.value})}
                                    style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                                >
                                    <option value="Supporting Proof">Supporting Proof</option>
                                    <option value="Medical / Disability">Medical / Disability</option>
                                    <option value="Sports & Extra-Curricular">Sports & Extra-Curricular</option>
                                    <option value="Special Quota / Category">Special Quota / Category</option>
                                    <option value="Academic Distinction">Academic Distinction</option>
                                    <option value="Other Document">Other Document</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Reason for Submitting This Document *
                                </label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Additional eligibility proof for special quota" 
                                    value={customDocForm.reason}
                                    onChange={(e) => setCustomDocForm({...customDocForm, reason: e.target.value})}
                                    style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Choose File (PDF, PNG, JPG) *
                                </label>
                                <input 
                                    type="file" 
                                    required
                                    onChange={(e) => setCustomDocForm({...customDocForm, file: e.target.files?.[0]})}
                                    style={{ width: '100%', fontSize: '12px', color: 'var(--text-secondary)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" className="button secondary" onClick={() => setCustomModalOpen(false)}>Cancel</button>
                                <button type="submit" className="button primary" disabled={customUploading}>
                                    {customUploading ? "Uploading..." : "Attach Document →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RE-SUBMIT / CORRECTION MODAL */}
            {resubmitModalOpen && resubmitTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid #f59e0b', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div>
                                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                                    Correction Request
                                </span>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                                    Upload Replacement for {resubmitTarget.doc.document_name}
                                </h3>
                            </div>
                            <button onClick={() => setResubmitModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {resubmitTarget.doc.admin_remarks && (
                            <div style={{ fontSize: '12px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '14px' }}>
                                <strong>Admin Note:</strong> {resubmitTarget.doc.admin_remarks}
                            </div>
                        )}

                        <form onSubmit={handleResubmitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Select Corrected File (PDF, PNG, JPG) *
                                </label>
                                <input 
                                    type="file" 
                                    required
                                    onChange={(e) => setResubmitFile(e.target.files?.[0])}
                                    style={{ width: '100%', fontSize: '12px', color: 'var(--text-secondary)' }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Student Remarks on Correction (Optional)
                                </label>
                                <textarea 
                                    rows={2} 
                                    placeholder="Explain changes made to the document..."
                                    value={resubmitRemarks} 
                                    onChange={(e) => setResubmitRemarks(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" className="button secondary" onClick={() => setResubmitModalOpen(false)}>Cancel</button>
                                <button type="submit" className="button primary" disabled={resubmitting} style={{ background: '#f59e0b', border: '1px solid #d97706' }}>
                                    {resubmitting ? "Submitting Version..." : `Submit Version ${(resubmitTarget.doc.version || 1) + 1} →`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DOCUMENT VERSION HISTORY MODAL */}
            {historyModalOpen && historyTargetDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '24px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <span className="badge">Audit Trail</span>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                                    Document Version History: {historyTargetDoc.document_name}
                                </h3>
                            </div>
                            <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                            {(historyTargetDoc.version_history || []).map((v, vIdx) => (
                                <div key={vIdx} style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                                            Version {v.version || (vIdx + 1)} — {v.action || 'Submission'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {v.timestamp || 'Recently'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        Status: <strong style={{ color: v.status === 'Verified' ? '#10b981' : (v.status === 'Rejected' ? '#f87171' : '#38bdf8') }}>{v.status}</strong>
                                    </div>
                                    {v.remarks && <div style={{ fontSize: '11px', color: '#c084fc', marginTop: '2px' }}>Remarks: {v.remarks}</div>}
                                    {v.reason && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>Reason: {v.reason}</div>}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="button" className="button secondary" onClick={() => setHistoryModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OFFICIAL SUBMISSION RECEIPT MODAL */}
            {receiptModalApp && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '2px solid #cbd5e1', position: 'relative' }}>
                        
                        {/* Action Bar (Top Right) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' }}>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <span>🖨️</span>
                                <span>Print / Save PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setReceiptModalApp(null)}
                                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Printable Document Content */}
                        <div style={{ border: '2px solid #0f172a', padding: '24px', borderRadius: '8px', background: '#ffffff' }}>
                            
                            {/* College Header */}
                            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '10px', letterSpacing: '2px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                                    Government of India & State Higher Education Council
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '4px 0', textTransform: 'uppercase' }}>
                                    College of Engineering & Technology
                                </h2>
                                <div style={{ fontSize: '11px', color: '#475569' }}>
                                    Office of Student Welfare & Scholarship Administration
                                </div>
                                <div style={{ display: 'inline-block', background: '#0f172a', color: '#ffffff', padding: '4px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Official Scholarship Application Acknowledgement Form
                                </div>
                            </div>

                            {/* Application & QR Metadata */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Application Tracking Reference:</div>
                                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#4f46e5' }}>#{receiptModalApp.id}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                        Submission Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>Verification Status:</div>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: receiptModalApp.status === 'Approved' ? '#059669' : '#d97706' }}>
                                        ● {receiptModalApp.status || 'Under Review'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Mode: {receiptModalApp.application_mode || 'Online'}</div>
                                </div>
                            </div>

                            {/* Student Profile Data Table */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                    1. Applicant Personal & Academic Details
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, width: '30%' }}>Student Full Name</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '70%' }}>{receiptModalApp.student_name || student?.name || 'Verified Student'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Roll / Admission ID</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#4f46e5' }}>{receiptModalApp.student_id || student?.id || '23CSEBE274'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Department & Year</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{receiptModalApp.department || 'CSE'} — Year {receiptModalApp.year || '3'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Cumulative CGPA</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700 }}>{receiptModalApp.cgpa || '8.5'} / 10.0</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Annual Family Income</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>₹{Number(receiptModalApp.family_income || 250000).toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Scholarship Scheme Details */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                    2. Scholarship Scheme Applied
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, width: '30%' }}>Scholarship Title</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 800 }}>{receiptModalApp.scholarship_name}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Scheme Category</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{receiptModalApp.category_name || 'General Category'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Sanctioned Grant Amount</td>
                                            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#059669' }}>{receiptModalApp.disbursed_amount || receiptModalApp.applied_amount || '₹50,000'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Document Checklist */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                    3. Attached Verification Documents Checklist
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                                    {(receiptModalApp.documents || [
                                        { document_name: "Aadhaar Card Copy", status: "Verified" },
                                        { document_name: "Annual Income Certificate", status: "Verified" },
                                        { document_name: "Academic Marksheets", status: "Verified" },
                                        { document_name: "Bonafide Certificate", status: "Verified" }
                                    ]).map((doc, dIdx) => (
                                        <div key={dIdx} style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>✓ {doc.document_name}</span>
                                            <span style={{ fontSize: '9.5px', fontWeight: 800, color: doc.status === 'Verified' ? '#059669' : '#d97706' }}>
                                                [{doc.status || 'Attached'}]
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Institutional Signatures & Verification Seal */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                                <div style={{ textAlign: 'center', width: '160px' }}>
                                    <div style={{ height: '30px' }} />
                                    <div style={{ borderTop: '1px solid #0f172a', fontSize: '10px', fontWeight: 700, paddingTop: '4px' }}>
                                        Student Signature
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', width: '160px' }}>
                                    <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>[Institutional Stamp]</div>
                                    <div style={{ border: '1px solid #0f172a', borderRadius: '50%', width: '55px', height: '55px', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, textAlign: 'center' }}>
                                        VERIFIED<br/>OFFICE
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', width: '160px' }}>
                                    <div style={{ height: '30px' }} />
                                    <div style={{ borderTop: '1px solid #0f172a', fontSize: '10px', fontWeight: 700, paddingTop: '4px' }}>
                                        Scholarship Nodal Officer
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
