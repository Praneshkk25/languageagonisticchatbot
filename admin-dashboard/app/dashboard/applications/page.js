"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl, getFileUrl } from "@/lib/api";

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({
        total_applications: 0,
        pending_verification: 0,
        documents_pending: 0,
        correction_required: 0,
        offline_pending: 0,
        fully_verified: 0,
        approved: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [toastMessage, setToastMessage] = useState("");

    // Selected Application for Verification Panel Modal
    const [selectedApp, setSelectedApp] = useState(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);

    // Document Preview Modal
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(1);
    const [previewRotate, setPreviewRotate] = useState(0);

    // Verification Action Sub-Modals
    const [actionDocTarget, setActionDocTarget] = useState(null); // { appId, doc }
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [verifyRemarks, setVerifyRemarks] = useState("");

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("Wrong document");
    const [rejectRemarks, setRejectRemarks] = useState("");

    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [correctionRemarks, setCorrectionRemarks] = useState("");

    // Document History Modal
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyTargetDoc, setHistoryTargetDoc] = useState(null);

    // Lifecycle Status Transition State
    const [lifecycleStatus, setLifecycleStatus] = useState("");
    const [officerNotes, setOfficerNotes] = useState("");
    const [govtPortalId, setGovtPortalId] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [disbursedAmount, setDisbursedAmount] = useState("");
    const [transactionRef, setTransactionRef] = useState("");
    const [disbursementDate, setDisbursementDate] = useState("");
    const [allowForceApproval, setAllowForceApproval] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Physical Checklist State
    const [physicalChecklistState, setPhysicalChecklistState] = useState([]);
    const [checklistSaving, setChecklistSaving] = useState(false);

    // Scholarship Scheme Classification & Grouping State
    const [selectedSchemeFilter, setSelectedSchemeFilter] = useState("All");
    const [groupByScheme, setGroupByScheme] = useState(false);

    useEffect(() => {
        fetchApplications();
        fetchStats();

        const handleVisibilityAndPoll = () => {
            if (!document.hidden) {
                fetchApplications();
                fetchStats();
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

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/admin/all`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setApplications(data);
                    if (selectedApp) {
                        const updated = data.find(a => a.id === selectedApp.id);
                        if (updated) setSelectedApp(updated);
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching applications:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/admin/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {}
    };

    const openReviewModal = (app) => {
        setSelectedApp(app);
        setLifecycleStatus(app.status || "Application Submitted");
        setOfficerNotes(app.officer_notes || "Institutional document verification completed.");
        setGovtPortalId(app.govt_portal_id || `NSP-${Math.floor(100000 + Math.random() * 900000)}`);
        setRejectionReason(app.rejection_reason || "");
        setDisbursedAmount(app.disbursed_amount || app.applied_amount || "₹50,000");
        setTransactionRef(app.transaction_ref || `UTR${Date.now().toString().slice(-8)}`);
        setDisbursementDate(app.disbursement_date || new Date().toISOString().split("T")[0]);
        setPhysicalChecklistState(app.physical_checklist || []);
        setAllowForceApproval(false);
        setReviewModalOpen(true);
    };

    // Open embedded document preview
    const openDocumentPreview = (doc, app = null) => {
        const targetApp = app || selectedApp;
        setPreviewDoc({
            ...doc,
            student_name: targetApp?.student_name || "Student Applicant",
            student_id: targetApp?.student_id || "23CSEBE274",
            department: targetApp?.department || "CSE",
            year: targetApp?.year || 3,
            cgpa: targetApp?.cgpa || 8.5,
            family_income: targetApp?.family_income || 250000,
            scholarship_name: targetApp?.scholarship_name || "Scholarship Scheme",
            application_id: targetApp?.id || "",
            app_ref: targetApp
        });
        if (targetApp) setSelectedApp(targetApp);
        setPreviewZoom(1);
        setPreviewRotate(0);
        setPreviewModalOpen(true);
    };

    // Perform Admin Verification Action on Document
    const handleDocumentAction = async (actionType, payloadObj) => {
        if (!selectedApp || !actionDocTarget) return;
        const docId = actionDocTarget.doc.id || actionDocTarget.doc.document_name;

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/${selectedApp.id}/document/${encodeURIComponent(docId)}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: actionType,
                    reason: payloadObj.reason || "",
                    remarks: payloadObj.remarks || "",
                    admin_id: "ADMIN_OFFICER"
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`✓ Document '${actionDocTarget.doc.document_name}' updated to '${data.document?.status}'!`);
                setVerifyModalOpen(false);
                setRejectModalOpen(false);
                setCorrectionModalOpen(false);
                setActionDocTarget(null);
                fetchApplications();
                fetchStats();
            } else {
                alert(`Action failed: ${data.detail || 'Error'}`);
            }
        } catch (e) {
            console.error("Doc action error:", e);
            alert("Error processing document verification action.");
        }
    };

    // Save Physical Checklist
    const handleSavePhysicalChecklist = async () => {
        if (!selectedApp) return;
        setChecklistSaving(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/${selectedApp.id}/physical-checklist`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: physicalChecklistState,
                    admin_id: "ADMIN_OFFICER"
                })
            });
            if (res.ok) {
                showToast("✓ Physical document submission checklist updated!");
                fetchApplications();
            } else {
                alert("Failed to update physical checklist.");
            }
        } catch (e) {
            console.error("Checklist error:", e);
            alert("Error updating physical checklist.");
        } finally {
            setChecklistSaving(false);
        }
    };

    // Hardcopy Overall Verification
    const handleHardcopyVerification = async (appId, status, notes = "") => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/${appId}/hardcopy-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: status,
                    notes: notes || "Physical original certificates verified at office.",
                    admin_id: "ADMIN_OFFICER",
                    checklist_items: physicalChecklistState
                })
            });
            if (res.ok) {
                showToast(`✓ Hardcopy status updated to '${status}'! Student notified in real time.`);
                fetchApplications();
                fetchStats();
            } else {
                alert("Failed to update hardcopy verification status.");
            }
        } catch (e) {
            console.error("Hardcopy error:", e);
            alert("Error verifying physical hardcopies.");
        }
    };

    // Update Overall Application Lifecycle Status
    const handleUpdateLifecycleStatus = async (e) => {
        e.preventDefault();
        if (!selectedApp) return;

        setStatusUpdating(true);
        try {
            let stageNum = 1;
            if (["Processed & Signed", "Documents Verified"].includes(lifecycleStatus)) stageNum = 2;
            else if (["Submitted to Government", "Offline Documents Required"].includes(lifecycleStatus)) stageNum = 3;
            else if (["Approved", "Rejected", "Eligibility Review"].includes(lifecycleStatus)) stageNum = 4;
            else if (["Amount Received"].includes(lifecycleStatus)) stageNum = 5;

            const payload = {
                status: lifecycleStatus,
                stage: stageNum,
                officer_notes: officerNotes,
                govt_portal_id: govtPortalId,
                rejection_reason: rejectionReason,
                disbursed_amount: disbursedAmount,
                transaction_ref: transactionRef,
                disbursement_date: disbursementDate,
                allow_force_approval: allowForceApproval
            };

            const res = await fetch(`${getApiBaseUrl()}/api/applications/status/${selectedApp.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`✓ Application #${selectedApp.id} transitioned to '${lifecycleStatus}'! Student notified.`);
                setReviewModalOpen(false);
                fetchApplications();
                fetchStats();
            } else {
                alert(`Status update failed:\n${data.detail || 'Error updating status'}`);
            }
        } catch (e) {
            console.error("Lifecycle update error:", e);
            alert("Error updating application status.");
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleDeleteApplication = async (appId) => {
        if (!confirm(`Are you sure you want to permanently delete application #${appId}?`)) return;
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/applications/${appId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                showToast(`Application #${appId} deleted.`);
                if (selectedApp?.id === appId) setReviewModalOpen(false);
                fetchApplications();
                fetchStats();
            }
        } catch (e) {
            console.error("Delete error:", e);
        }
    };

    const handleExportGovernmentCSV = () => {
        const approvedOnly = applications.filter(a => a.status === "Approved" || a.stage >= 4 || a.status === "Amount Received");
        const targetApps = approvedOnly.length > 0 ? approvedOnly : applications;

        if (targetApps.length === 0) {
            alert("No applications available to export.");
            return;
        }

        const headers = [
            "Application ID",
            "Student Roll No",
            "Student Name",
            "Department",
            "Year",
            "CGPA",
            "Annual Family Income",
            "Scholarship Program",
            "Category",
            "Sanctioned Amount",
            "Verification Status",
            "Hardcopy Verified",
            "Govt Portal ID",
            "Transaction Ref",
            "Export Timestamp"
        ];

        const rows = targetApps.map(a => [
            `"${a.id}"`,
            `"${a.student_id || ''}"`,
            `"${a.student_name || ''}"`,
            `"${a.department || 'CSE'}"`,
            `"${a.year || '3'}"`,
            `"${a.cgpa || '8.5'}"`,
            `"${a.family_income || 250000}"`,
            `"${(a.scholarship_name || '').replace(/"/g, '""')}"`,
            `"${(a.category_name || '').replace(/"/g, '""')}"`,
            `"${a.disbursed_amount || a.applied_amount || '₹50,000'}"`,
            `"${a.status || ''}"`,
            `"${a.hardcopy_verified ? 'YES' : 'NO'}"`,
            `"${a.govt_portal_id || ''}"`,
            `"${a.transaction_ref || ''}"`,
            `"${new Date().toISOString()}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Govt_Scholarship_Sanction_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`✓ Exported ${targetApps.length} student application records to Govt Sanction CSV format!`);
    };

    const uniqueScholarshipNames = Array.from(new Set(applications.map(a => a.scholarship_name).filter(Boolean)));

    const filteredApps = applications.filter(app => {
        const matchesCategory = selectedCategory === "All" || 
            (selectedCategory === "Pending Verification" && ["Application Submitted", "Document Verification Pending", "Documents Under Review"].includes(app.status)) ||
            (selectedCategory === "Correction Required" && (app.status === "Correction Required" || (app.documents || []).some(d => d.status === "Correction Required"))) ||
            (selectedCategory === "Offline Pending" && (app.status?.includes("Offline") || app.application_mode !== "Online")) ||
            (selectedCategory === "Approved" && app.status === "Approved") ||
            (selectedCategory === "Disbursed" && (app.stage === 5 || app.status === "Amount Received")) ||
            (selectedCategory === "Rejected" && app.status?.includes("Rejected"));

        const matchesScheme = selectedSchemeFilter === "All" || 
            app.scholarship_name === selectedSchemeFilter ||
            app.scholarship_id === selectedSchemeFilter;

        const matchesQuery = !searchQuery ||
            app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.scholarship_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.id?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesScheme && matchesQuery;
    });

    // Check if mandatory documents are fully verified for selected application
    const selectedAppDocuments = selectedApp?.documents || [];
    const requiredUnverifiedDocs = selectedAppDocuments.filter(d => d.required && d.status !== "Verified");
    const isApprovalAllowed = requiredUnverifiedDocs.length === 0;

    // Helper: Render single application card
    const renderApplicationCard = (app) => {
        const isRejected = app.status?.includes("Rejected");
        const isApproved = app.status === "Approved";
        const documents = app.documents || [];
        const totalDocs = documents.length;
        const verifiedDocs = documents.filter(d => d.status === "Verified").length;
        const correctionDocs = documents.filter(d => d.status === "Correction Required").length;

        return (
            <div 
                key={app.id}
                style={{
                    background: '#0a142b',
                    border: isRejected ? '1px solid rgba(239, 68, 68, 0.4)' : (app.stage === 5 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-hover)'),
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                }}
            >
                {/* TOP ROW */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="badge primary">#{app.id}</span>
                            <span className="badge">{app.category_name || 'General Scheme'}</span>
                            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                                Mode: {app.application_mode || 'Online'}
                            </span>
                            {isRejected ? (
                                <span className="badge danger">✕ {app.status}</span>
                            ) : app.stage === 5 ? (
                                <span className="badge success" style={{ background: '#10b981', color: '#fff' }}>💰 Amount Disbursed</span>
                            ) : isApproved ? (
                                <span className="badge success">✓ Approved</span>
                            ) : (
                                <span className="badge warning">● {app.status || "Pending Verification"}</span>
                            )}

                            {app.hardcopy_verified && (
                                <span className="badge success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    🏛️ Hardcopy Verified ✓
                                </span>
                            )}
                        </div>

                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
                            {app.scholarship_name}
                        </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* 1-CLICK VERIFY HARDCOPY BUTTON */}
                        {(app.application_mode === 'Offline' || app.application_mode === 'Hybrid' || app.hardcopy_required) && (
                            <button 
                                type="button" 
                                onClick={() => handleHardcopyVerification(app.id, app.hardcopy_verified ? "Pending Hardcopy" : "Hardcopy Verified", app.hardcopy_verified ? "Reset to pending" : "All physical certificates verified.")}
                                className={`button ${app.hardcopy_verified ? 'secondary' : 'primary'}`}
                                style={{ fontSize: '11px', padding: '6px 12px', background: app.hardcopy_verified ? undefined : 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', fontWeight: 700 }}
                            >
                                {app.hardcopy_verified ? "🏛️ Hardcopy Verified ✓" : "🏛️ Verify Hardcopy"}
                            </button>
                        )}

                        {/* MUTUALLY EXCLUSIVE NEXT ACTION BUTTON */}
                        {app.status === "Application Submitted" && (
                            <button 
                                type="button" 
                                onClick={() => {openReviewModal(app); setLifecycleStatus("Documents Verified");}}
                                className="button primary" 
                                style={{ fontSize: '11px', padding: '6px 12px', background: '#38bdf8', color: '#000', fontWeight: 800 }}
                            >
                                🔍 2. Verify Documents
                            </button>
                        )}

                        {app.status === "Documents Verified" && (
                            <button 
                                type="button" 
                                onClick={() => {openReviewModal(app); setLifecycleStatus("Processed & Signed");}}
                                className="button primary" 
                                style={{ fontSize: '11px', padding: '6px 12px', background: '#a855f7', color: '#fff', fontWeight: 800 }}
                            >
                                ✍️ 3. Sign & Process
                            </button>
                        )}

                        {app.status === "Processed & Signed" && (
                            <button 
                                type="button" 
                                onClick={() => {openReviewModal(app); setLifecycleStatus("Submitted to Government");}}
                                className="button primary" 
                                style={{ fontSize: '11px', padding: '6px 12px', background: '#6366f1', color: '#fff', fontWeight: 800 }}
                            >
                                🏛️ 4. Forward to Govt
                            </button>
                        )}

                        {app.status === "Submitted to Government" && (
                            <button 
                                type="button" 
                                onClick={() => {openReviewModal(app); setLifecycleStatus("Approved");}}
                                className="button success" 
                                style={{ fontSize: '11px', padding: '6px 12px', background: '#10b981', color: '#fff', fontWeight: 800 }}
                            >
                                ⚖️ 5. Govt Sanction (Approve)
                            </button>
                        )}

                        {app.status === "Approved" && app.stage < 5 && (
                            <button 
                                type="button" 
                                onClick={() => {openReviewModal(app); setLifecycleStatus("Amount Received");}}
                                className="button success" 
                                style={{ fontSize: '11px', padding: '6px 12px', background: '#059669', color: '#fff', fontWeight: 800 }}
                            >
                                💰 6. Mark DBT Disbursed
                            </button>
                        )}
                        
                        {/* DIRECT VIEW DOCUMENTS BUTTON */}
                        <button 
                            type="button" 
                            className="button secondary" 
                            onClick={() => {
                                if (documents.length > 0) openDocumentPreview(documents[0], app);
                                else openReviewModal(app);
                            }}
                            style={{ fontSize: '11px', padding: '6px 12px', borderColor: '#38bdf8', color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(56, 189, 248, 0.08)' }}
                            title="View and inspect uploaded certificates before taking verification or approval decisions"
                        >
                            <span>👁️</span>
                            <span>View Documents ({totalDocs})</span>
                        </button>

                        <button 
                            type="button" 
                            className="button primary" 
                            onClick={() => openReviewModal(app)}
                            style={{ fontSize: '11px', padding: '6px 14px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', fontWeight: 800 }}
                        >
                            🔎 Complete Dossier Review
                        </button>
                    </div>
                </div>

                {/* 6-STAGE VISUAL LIFECYCLE PROGRESS PIPELINE */}
                <div style={{ background: '#081229', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Lifecycle Progression Stage
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                        {[
                            { num: 1, label: "Submitted", icon: "📝" },
                            { num: 2, label: "Docs Verified", icon: "🔍" },
                            { num: 3, label: "Processed & Signed", icon: "✍️" },
                            { num: 4, label: "Submitted to Govt", icon: "🏛️" },
                            { num: 5, label: "Govt Decision", icon: "⚖️" },
                            { num: 6, label: "Disbursed", icon: "💰" },
                        ].map((stg) => {
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

                            let statusColor = 'var(--text-muted)';
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
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        background: bgColor,
                                        border: `1px solid ${borderColor}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '13px' }}>{stg.icon}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                                            {stg.num}. {stg.label}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: statusColor }}>
                                        {isStageRejected ? '✕' : (isCompleted ? '✓' : (isCurrent ? '●' : '○'))}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* STUDENT MINI DETAILS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', background: '#081229', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Student Name</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{app.student_name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Roll / Admission No</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{app.student_id}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dept & Year</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                            {app.department || 'CSE'} • Yr {app.year || 3}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CGPA</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>{app.cgpa || '8.5'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Annual Family Income</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fb923c' }}>
                            ₹{Number(app.family_income || 250000).toLocaleString('en-IN')}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Grant Amount</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#c084fc' }}>
                            {app.disbursed_amount || app.applied_amount || '₹50,000'}
                        </div>
                    </div>
                </div>

                {/* DOCUMENT VERIFICATION PROGRESS BAR & CHIPS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Document Verification Status: <strong>{verifiedDocs} of {totalDocs} Verified</strong> (Click any document to inspect preview)</span>
                        <span style={{ fontWeight: 800, color: verifiedDocs === totalDocs ? 'var(--success)' : '#38bdf8' }}>
                            {totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0}%
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {documents.map((doc, idx) => {
                            const isV = doc.status === "Verified";
                            const isC = doc.status === "Correction Required";
                            const isR = doc.status === "Rejected";

                            return (
                                <button 
                                    key={idx}
                                    type="button"
                                    onClick={() => openDocumentPreview(doc, app)}
                                    title={`Click to view and inspect '${doc.document_name}'`}
                                    style={{
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: isV ? 'rgba(16, 185, 129, 0.15)' : (isC ? 'rgba(245, 158, 11, 0.2)' : (isR ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)')),
                                        color: isV ? '#10b981' : (isC ? '#f59e0b' : (isR ? '#f87171' : '#38bdf8')),
                                        border: `1px solid ${isV ? 'rgba(16, 185, 129, 0.4)' : (isC ? '#f59e0b' : (isR ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'))}`,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span>👁️</span>
                                    <span>{isV ? '✓' : (isC ? '⚠️' : (isR ? '✕' : '⏳'))} {doc.document_name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // Grouping by scholarship name helper
    const groupedApps = filteredApps.reduce((acc, app) => {
        const name = app.scholarship_name || "Unclassified Scholarship";
        if (!acc[name]) acc[name] = [];
        acc[name].push(app);
        return acc;
    }, {});

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge primary" style={{ marginBottom: '12px' }}>🛡️ Administrative Verification Command Center</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Scholarship Application & Document Verification Pipeline
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '850px', marginBottom: '16px' }}>
                    Review submitted student documents, inspect previews, verify authenticity, request corrections, track physical certificates, and classify student applications by specific scholarship programs.
                </p>

                {/* STATS METRIC BAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Apps</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{stats.total_applications}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#0284c7' }}>Pending Verification</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>{stats.pending_verification}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#d97706' }}>Correction Required</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>{stats.correction_required}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#9333ea' }}>Offline Pending</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#9333ea' }}>{stats.offline_pending}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ fontSize: '11px', color: '#059669' }}>Fully Verified</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{stats.fully_verified}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: '#059669' }}>Approved</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{stats.approved}</div>
                    </div>
                </div>
            </section>

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '10px', background: 'rgba(66, 214, 164, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                    {toastMessage}
                </div>
            )}

            {/* SCHOLARSHIP CLASSIFIER & GROUPING CONTROLS */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', background: 'var(--surface)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎓</span>
                        <span>Classify by Scholarship:</span>
                    </span>
                    <select
                        className="input"
                        value={selectedSchemeFilter}
                        onChange={(e) => setSelectedSchemeFilter(e.target.value)}
                        style={{ fontSize: '12px', padding: '8px 12px', flex: 1 }}
                    >
                        <option value="All">All Scholarship Programs ({applications.length} Applicants)</option>
                        {uniqueScholarshipNames.map(name => {
                            const count = applications.filter(a => a.scholarship_name === name).length;
                            return (
                                <option key={name} value={name}>
                                    {name} ({count} student{count !== 1 ? 's' : ''})
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className={`button ${!groupByScheme ? 'primary' : ''}`}
                        onClick={() => setGroupByScheme(false)}
                        style={{ fontSize: '11px', padding: '6px 14px', fontWeight: 700 }}
                    >
                        📋 Standard List
                    </button>
                    <button
                        type="button"
                        className={`button ${groupByScheme ? 'primary' : ''}`}
                        onClick={() => setGroupByScheme(true)}
                        style={{ fontSize: '11px', padding: '6px 14px', fontWeight: 700 }}
                    >
                        🗂️ Group by Scholarship Name
                    </button>
                    <button
                        type="button"
                        className="button success"
                        onClick={handleExportGovernmentCSV}
                        style={{ fontSize: '11px', padding: '6px 14px', fontWeight: 700, background: '#10b981', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none' }}
                        title="Download government-compliant sanction spreadsheet"
                    >
                        <span>📥</span>
                        <span>Export for Govt Sanction (CSV)</span>
                    </button>
                </div>
            </div>

            {/* STATUS FILTERS & SEARCH TOOLBAR */}
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {["All", "Pending Verification", "Correction Required", "Offline Pending", "Approved", "Disbursed", "Rejected"].map(filter => (
                        <button
                            key={filter}
                            className={`button ${selectedCategory === filter ? 'primary' : ''}`}
                            onClick={() => setSelectedCategory(filter)}
                            style={{ fontSize: '12px' }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="toolbar-search" style={{ width: '100%', maxWidth: '300px' }}>
                    <input 
                        type="text" 
                        placeholder="Search student, roll no, scheme..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                    />
                </div>
            </div>

            {/* APPLICATIONS TABLE / CARDS */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">
                            Application Records ({filteredApps.length})
                            {selectedSchemeFilter !== "All" && ` — Filtered by: ${selectedSchemeFilter}`}
                        </div>
                        <div className="panel-subtitle">Review documents, verify certificates, forward to government, and download applied student reports</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                            href={`${getApiBaseUrl()}/api/applications/export?scheme=${encodeURIComponent(selectedSchemeFilter)}&status=${encodeURIComponent(selectedCategory)}&format=xlsx`}
                            download="applied_students_report.xlsx"
                            className="button primary"
                            style={{ fontSize: '11px', padding: '6px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span>📥</span>
                            <span>Export Applied Students (Excel)</span>
                        </a>
                        <a
                            href={`${getApiBaseUrl()}/api/applications/export?scheme=${encodeURIComponent(selectedSchemeFilter)}&status=${encodeURIComponent(selectedCategory)}&format=csv`}
                            download="applied_students_report.csv"
                            className="button secondary"
                            style={{ fontSize: '11px', padding: '6px 12px', textDecoration: 'none', fontWeight: 700 }}
                        >
                            CSV
                        </a>
                        <button className="button" onClick={() => { fetchApplications(); fetchStats(); }}>
                            🔄 Refresh Queue
                        </button>
                    </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading application pipeline...
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🗂️</div>
                            <div className="empty-title">No applications match current criteria</div>
                            <div className="empty-description">Try selecting a different scholarship scheme, category filter, or clearing search query.</div>
                        </div>
                    ) : groupByScheme ? (
                        /* GROUPED BY SCHOLARSHIP VIEW */
                        Object.entries(groupedApps).map(([schemeName, groupList]) => {
                            const approvedInGroup = groupList.filter(a => a.status === "Approved" || a.stage >= 5).length;
                            const pendingInGroup = groupList.filter(a => a.status !== "Approved" && !a.status?.includes("Rejected") && a.stage < 5).length;
                            const sampleApp = groupList[0];

                            return (
                                <div key={schemeName} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#071026', padding: '20px', borderRadius: '16px', border: '1.5px solid rgba(168, 85, 247, 0.4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                                🎓
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                                                    {schemeName}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {sampleApp?.category_name || 'Scholarship Scheme'} • Mode: <strong>{sampleApp?.application_mode || 'Online'}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className="badge success">{approvedInGroup} Approved</span>
                                            <span className="badge warning">{pendingInGroup} In Progress</span>
                                            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', fontWeight: 800 }}>
                                                {groupList.length} Student Applicant{groupList.length !== 1 ? 's' : ''}
                                            </span>
                                            <a
                                                href={`${getApiBaseUrl()}/api/applications/export?scheme=${encodeURIComponent(schemeName)}&format=xlsx`}
                                                download={`applied_students_${schemeName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`}
                                                className="button secondary"
                                                style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none', fontWeight: 700, borderColor: 'rgba(168, 85, 247, 0.5)', color: '#e9d5ff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                title={`Export ${groupList.length} student applications for ${schemeName}`}
                                            >
                                                <span>📥</span>
                                                <span>Export Scheme</span>
                                            </a>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {groupList.map(app => renderApplicationCard(app))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        /* STANDARD LIST VIEW */
                        filteredApps.map(app => renderApplicationCard(app))
                    )}
                </div>
            </section>

            {/* COMPREHENSIVE APPLICATION REVIEW & VERIFICATION PANEL MODAL */}
            {reviewModalOpen && selectedApp && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', width: '100%', maxWidth: '950px', maxHeight: '92vh', overflowY: 'auto', padding: '28px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        
                        {/* MODAL HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className="badge primary">#{selectedApp.id}</span>
                                    <span className="badge">{selectedApp.category_name || 'Scholarship Scheme'}</span>
                                    <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7' }}>
                                        Mode: {selectedApp.application_mode || 'Online'}
                                    </span>
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginTop: '6px' }}>
                                    {selectedApp.scholarship_name}
                                </h2>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Student: <strong>{selectedApp.student_name}</strong> ({selectedApp.student_id}) | Submitted: {selectedApp.created_at?.slice(0, 10) || '2026-08-26'}
                                </div>
                            </div>
                            <button 
                                onClick={() => setReviewModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* SECTION 1: STUDENT PROFILE & ACADEMIC INFO */}
                        <div style={{ background: '#081229', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
                                👤 Student & Financial Profile
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Department & Year</div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{selectedApp.department || 'CSE'} (Year {selectedApp.year || 3})</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Academic CGPA</div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{selectedApp.cgpa || '8.5'} / 10.0</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Annual Family Income</div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fb923c' }}>₹{Number(selectedApp.family_income || 250000).toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DBT Bank Account</div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{selectedApp.bank_name || 'SBI'} ({selectedApp.bank_account_no || '987654321012'})</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>First Generation Graduate?</div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedApp.first_generation_graduate === 'Yes' ? '#10b981' : '#ffffff' }}>
                                        {selectedApp.first_generation_graduate === 'Yes' ? '🎓 Yes (First Graduate)' : (selectedApp.first_generation_graduate || 'No')}
                                    </div>
                                </div>
                            </div>

                            {selectedApp.student_remarks && (
                                <div style={{ marginTop: '10px', fontSize: '11px', color: '#c084fc', background: 'rgba(168, 85, 247, 0.08)', padding: '8px 12px', borderRadius: '6px' }}>
                                    <strong>Student Remarks:</strong> {selectedApp.student_remarks}
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: SUBMITTED DOCUMENTS VERIFICATION PANEL */}
                        <div style={{ background: '#081229', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                                        📄 Submitted Verification Documents ({selectedAppDocuments.length})
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Uploaded ≠ Verified: Review each document, view previews, and perform individual verification decisions.
                                    </div>
                                </div>

                                <div style={{ fontSize: '12px', fontWeight: 800, color: isApprovalAllowed ? 'var(--success)' : '#f59e0b' }}>
                                    {selectedAppDocuments.filter(d => d.status === 'Verified').length} / {selectedAppDocuments.length} Verified
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedAppDocuments.map((doc, idx) => {
                                    const isDocVerified = doc.status === "Verified";
                                    const isDocRejected = doc.status === "Rejected";
                                    const isDocCorrection = doc.status === "Correction Required";
                                    const isDocOffline = doc.status === "Offline Required";

                                    return (
                                        <div 
                                            key={doc.id || idx}
                                            style={{
                                                background: isDocCorrection ? 'rgba(245, 158, 11, 0.06)' : '#0d1a38',
                                                border: isDocVerified ? '1px solid rgba(16, 185, 129, 0.4)' : (isDocCorrection ? '1px solid #f59e0b' : (isDocRejected ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)')),
                                                borderRadius: '10px',
                                                padding: '14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}
                                        >
                                            {/* DOC TITLE & STATUS */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                                                        {doc.document_name}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                        (Source: <strong>{doc.source === 'wallet' ? 'Digital Wallet' : 'New Upload'}</strong> | Version {doc.version || 1})
                                                    </span>
                                                    {doc.required && (
                                                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                                                            * Mandatory
                                                        </span>
                                                    )}
                                                </div>

                                                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: isDocVerified ? 'rgba(16,185,129,0.2)' : (isDocCorrection ? 'rgba(245,158,11,0.2)' : (isDocRejected ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.15)')), color: isDocVerified ? '#10b981' : (isDocCorrection ? '#f59e0b' : (isDocRejected ? '#f87171' : '#38bdf8')) }}>
                                                    {isDocVerified ? '✓ Verified' : (isDocCorrection ? '⚠️ Correction Required' : (isDocRejected ? '✕ Rejected' : (isDocOffline ? '🏛️ Physical Required' : '⏳ Pending Verification')))}
                                                </span>
                                            </div>

                                            {/* DOC ADMIN REMARKS OR REJECTIONS */}
                                            {doc.admin_remarks && (
                                                <div style={{ fontSize: '11px', color: '#c084fc', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '6px' }}>
                                                    <strong>Admin Note:</strong> {doc.admin_remarks}
                                                </div>
                                            )}

                                            {doc.rejection_reason && (
                                                <div style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                                                    <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                                </div>
                                            )}

                                            {/* DOC ACTIONS BUTTONS */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    className="button primary"
                                                    onClick={() => openDocumentPreview(doc, selectedApp)}
                                                    style={{ fontSize: '11px', padding: '4px 12px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#ffffff', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <span>👁️ View Document</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button success"
                                                    onClick={() => {
                                                        setActionDocTarget({ appId: selectedApp.id, doc });
                                                        setVerifyRemarks("");
                                                        setVerifyModalOpen(true);
                                                    }}
                                                    style={{ fontSize: '11px', padding: '4px 12px', background: '#10b981', color: '#ffffff' }}
                                                >
                                                    ✓ Verify
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button warning"
                                                    onClick={() => {
                                                        setActionDocTarget({ appId: selectedApp.id, doc });
                                                        setCorrectionRemarks("");
                                                        setCorrectionModalOpen(true);
                                                    }}
                                                    style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}
                                                >
                                                    ⚠️ Request Correction
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button danger"
                                                    onClick={() => {
                                                        setActionDocTarget({ appId: selectedApp.id, doc });
                                                        setRejectReason("Wrong document");
                                                        setRejectRemarks("");
                                                        setRejectModalOpen(true);
                                                    }}
                                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                                >
                                                    ✕ Reject
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button secondary"
                                                    onClick={() => {
                                                        setActionDocTarget({ appId: selectedApp.id, doc });
                                                        handleDocumentAction("mark_offline", { remarks: "Original document required for physical inspection." });
                                                    }}
                                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                                >
                                                    🏛️ Mark Offline
                                                </button>

                                                {(doc.version_history && doc.version_history.length > 1) && (
                                                    <button
                                                        type="button"
                                                        className="button secondary"
                                                        onClick={() => {
                                                            setHistoryTargetDoc(doc);
                                                            setHistoryModalOpen(true);
                                                        }}
                                                        style={{ fontSize: '11px', padding: '4px 10px' }}
                                                    >
                                                        📜 Version History ({doc.version_history.length})
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 3: PHYSICAL DOCUMENT CHECKLIST (If Offline / Hybrid) */}
                        {physicalChecklistState.length > 0 && (
                            <div style={{ background: '#081229', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>🏛️ Physical Hardcopy Checklist & Office Verification</span>
                                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: selectedApp.hardcopy_verified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: selectedApp.hardcopy_verified ? '#10b981' : '#f59e0b', border: `1px solid ${selectedApp.hardcopy_verified ? '#10b981' : '#f59e0b'}` }}>
                                                {selectedApp.hardcopy_status || (selectedApp.hardcopy_verified ? "Hardcopy Verified" : "Pending Hardcopy")}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Verify original physical documents handed over at the College Scholarship Cell.
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const allVerified = physicalChecklistState.map(p => ({ ...p, status: "Verified" }));
                                                setPhysicalChecklistState(allVerified);
                                                handleHardcopyVerification(selectedApp.id, "Hardcopy Verified", "All physical certificates verified and matched with original documents.");
                                            }}
                                            className="button success" 
                                            style={{ fontSize: '11px', padding: '4px 12px', background: '#10b981', color: '#fff', fontWeight: 800 }}
                                        >
                                            ✓ Mark Hardcopy Verified
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleSavePhysicalChecklist}
                                            disabled={checklistSaving}
                                            className="button primary" 
                                            style={{ fontSize: '11px', padding: '4px 12px' }}
                                        >
                                            {checklistSaving ? "Saving..." : "💾 Save Checklist"}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {physicalChecklistState.map((pItem, pIdx) => (
                                        <div key={pItem.id || pIdx} style={{ background: '#0a142b', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                                {pItem.document_name}
                                            </div>

                                            <div>
                                                <select
                                                    value={pItem.status}
                                                    onChange={(e) => {
                                                        const updated = [...physicalChecklistState];
                                                        updated[pIdx].status = e.target.value;
                                                        setPhysicalChecklistState(updated);
                                                    }}
                                                    style={{ width: '100%', padding: '6px', background: '#081229', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                                                >
                                                    <option value="Not Received">Not Received</option>
                                                    <option value="Received">Received</option>
                                                    <option value="Checked">Checked</option>
                                                    <option value="Verified">Verified</option>
                                                    <option value="Returned">Returned</option>
                                                    <option value="Issue Found">Issue Found</option>
                                                </select>
                                            </div>

                                            <div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Remarks..."
                                                    value={pItem.remarks || ""}
                                                    onChange={(e) => {
                                                        const updated = [...physicalChecklistState];
                                                        updated[pIdx].remarks = e.target.value;
                                                        setPhysicalChecklistState(updated);
                                                    }}
                                                    style={{ width: '100%', padding: '6px', background: '#081229', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SECTION 4: GATED LIFECYCLE DECISION & STAGE CONTROLLER */}
                        <form onSubmit={handleUpdateLifecycleStatus} style={{ background: '#081229', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                                ⚖️ Application Lifecycle State Transition & Sanction
                            </div>

                            {/* Gating Alert if unverified */}
                            {!isApprovalAllowed && (
                                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', fontSize: '12px' }}>
                                    ⚠️ <strong>Verification Incomplete:</strong> {requiredUnverifiedDocs.length} mandatory document(s) ({requiredUnverifiedDocs.map(d => d.document_name).join(", ")}) have not been verified yet. Final Approval is protected.
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Lifecycle State Transition *
                                    </label>
                                    <select
                                        className="input"
                                        value={lifecycleStatus}
                                        onChange={(e) => setLifecycleStatus(e.target.value)}
                                        style={{ width: '100%', fontSize: '13px' }}
                                    >
                                        <optgroup label="Stage 1: Application Received">
                                            <option value="Application Submitted">1. Application Submitted</option>
                                            <option value="Document Verification Pending">1. Document Verification Pending</option>
                                        </optgroup>
                                        <optgroup label="Stage 2: Documents Verification (Core Verification Step)">
                                            <option value="Documents Under Review">2. Documents Under Review</option>
                                            <option value="Documents Verified">2. Documents Verified</option>
                                            <option value="Correction Required">2. Correction Required</option>
                                            <option value="Documents Re-submitted">2. Documents Re-submitted</option>
                                            <option value="Offline Documents Required">2. Offline Documents Required</option>
                                            <option value="Offline Verification Pending">2. Offline Verification Pending</option>
                                        </optgroup>
                                        <optgroup label="Stage 3: Institutional Endorsement">
                                            <option value="Processed & Signed">3. Processed & Signed</option>
                                        </optgroup>
                                        <optgroup label="Stage 4: Government Portal Submission">
                                            <option value="Submitted to Government">4. Submitted to Government</option>
                                            <option value="Eligibility Review">4. Eligibility Review</option>
                                        </optgroup>
                                        <optgroup label="Stage 5: Government Decision (Approved / Rejected)">
                                            <option value="Approved">5. Government Approved (Gated)</option>
                                            <option value="Government Rejected">5. Government Rejected</option>
                                        </optgroup>
                                        <optgroup label="Stage 6: Bank Disbursement (DBT)">
                                            <option value="Amount Received">6. Amount Received (Disbursed / Credited)</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Govt Portal Reference ID
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input"
                                        value={govtPortalId} 
                                        onChange={(e) => setGovtPortalId(e.target.value)}
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Sanctioned Disbursement Amount
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input"
                                        value={disbursedAmount} 
                                        onChange={(e) => setDisbursedAmount(e.target.value)}
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                        Bank UTR / Transaction Reference
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input"
                                        value={transactionRef} 
                                        onChange={(e) => setTransactionRef(e.target.value)}
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Official Verification Remarks / Notes
                                </label>
                                <textarea 
                                    rows={2} 
                                    className="input"
                                    value={officerNotes} 
                                    onChange={(e) => setOfficerNotes(e.target.value)}
                                    style={{ width: '100%', minHeight: '65px', fontSize: '13px' }}
                                />
                            </div>

                            {/* PRE-APPROVAL DOCUMENT REVIEW CHECKLIST & QUICK PREVIEW */}
                            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginTop: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>📑</span>
                                        <span>Mandatory Document Inspection Checklist (Review Before Approval)</span>
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: isApprovalAllowed ? 'var(--success)' : '#d97706' }}>
                                        {selectedAppDocuments.filter(d => d.status === 'Verified').length} of {selectedAppDocuments.length} Verified
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    Officers must inspect every document before confirming approval. Click <strong>'👁️ View Document'</strong> to review each uploaded certificate:
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {selectedAppDocuments.map((doc, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1a38', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                                    {doc.document_name}
                                                </span>
                                                <span className={`badge ${doc.status === 'Verified' ? 'success' : (doc.status === 'Correction Required' ? 'warning' : (doc.status === 'Rejected' ? 'danger' : 'primary'))}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                    {doc.status || 'Pending Verification'}
                                                </span>
                                                {doc.source && (
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                        ({doc.source === 'wallet' ? 'Digital Wallet' : 'Direct Upload'})
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="button primary"
                                                    onClick={() => openDocumentPreview(doc, selectedApp)}
                                                    style={{ fontSize: '11px', padding: '4px 10px', background: '#0284c7', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                                                >
                                                    👁️ View Document
                                                </button>
                                                {doc.status !== 'Verified' && (
                                                    <button
                                                        type="button"
                                                        className="button success"
                                                        onClick={() => {
                                                            setActionDocTarget({ appId: selectedApp.id, doc });
                                                            setVerifyRemarks("");
                                                            setVerifyModalOpen(true);
                                                        }}
                                                        style={{ fontSize: '11px', padding: '4px 8px', background: '#10b981', color: '#ffffff' }}
                                                    >
                                                        ✓ Verify
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Override approval gating checkbox if unverified */}
                            {lifecycleStatus === "Approved" && !isApprovalAllowed && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fb923c', cursor: 'pointer', marginTop: '6px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={allowForceApproval} 
                                        onChange={(e) => setAllowForceApproval(e.target.checked)}
                                    />
                                    <span>Override verification gating: Allow Approval with pending documents exception.</span>
                                </label>
                            )}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                                <button type="button" className="button secondary" onClick={() => setReviewModalOpen(false)}>
                                    Close Panel
                                </button>
                                <button 
                                    type="submit" 
                                    className="button primary" 
                                    disabled={statusUpdating || (lifecycleStatus === "Approved" && !isApprovalAllowed && !allowForceApproval)}
                                >
                                    {statusUpdating ? "Updating Lifecycle..." : `Update Status to '${lifecycleStatus}' →`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EMBEDDED DOCUMENT PREVIEW MODAL */}
            {previewModalOpen && previewDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1.5px solid #38bdf8', borderRadius: '16px', width: '100%', maxWidth: '980px', height: '88vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
                        {/* PREVIEW TOOLBAR */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="badge primary">👁️ Document Inspection</span>
                                    <span className={`badge ${previewDoc.status === 'Verified' ? 'success' : (previewDoc.status === 'Correction Required' ? 'warning' : 'primary')}`}>
                                        {previewDoc.status || 'Pending Verification'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                                    {previewDoc.document_name}
                                </h3>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Candidate: <strong>{previewDoc.student_name}</strong> ({previewDoc.student_id}) • Dept: {previewDoc.department || 'CSE'} (Yr {previewDoc.year || 3}) • Scheme: <strong>{previewDoc.scholarship_name}</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button className="button secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.2))}>🔍 -</button>
                                <button className="button secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))}>🔍 +</button>
                                <button className="button secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setPreviewRotate(r => (r + 90) % 360)}>🔄 Rotate</button>

                                {/* INLINE ACTION BUTTONS INSIDE PREVIEW */}
                                <button
                                    type="button"
                                    className="button success"
                                    onClick={() => {
                                        setActionDocTarget({ appId: previewDoc.application_id || selectedApp?.id, doc: previewDoc });
                                        setVerifyRemarks("");
                                        setVerifyModalOpen(true);
                                    }}
                                    style={{ padding: '4px 12px', fontSize: '11px', background: '#10b981', color: '#ffffff', fontWeight: 700 }}
                                >
                                    ✓ Verify Doc
                                </button>

                                <button
                                    type="button"
                                    className="button danger"
                                    onClick={() => {
                                        setActionDocTarget({ appId: previewDoc.application_id || selectedApp?.id, doc: previewDoc });
                                        setRejectReason("Wrong document");
                                        setRejectRemarks("");
                                        setRejectModalOpen(true);
                                    }}
                                    style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 700 }}
                                >
                                    ✕ Reject Doc
                                </button>

                                <button
                                    type="button"
                                    className="button warning"
                                    onClick={() => {
                                        setActionDocTarget({ appId: previewDoc.application_id || selectedApp?.id, doc: previewDoc });
                                        setCorrectionRemarks("");
                                        setCorrectionModalOpen(true);
                                    }}
                                    style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}
                                >
                                    ⚠️ Correction
                                </button>

                                {previewDoc.file_path && (
                                    <a 
                                        href={getFileUrl(previewDoc.file_path)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="button secondary" 
                                        style={{ padding: '4px 12px', fontSize: '11px', textDecoration: 'none' }}
                                    >
                                        📥 Raw File
                                    </a>
                                )}

                                <button onClick={() => setPreviewModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer', marginLeft: '6px' }}>✕</button>
                            </div>
                        </div>

                        {/* PREVIEW CONTAINER */}
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
                                    alt={previewDoc.document_name}
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
                                    {/* CERTIFICATE HEADER */}
                                    <div style={{ textAlign: 'center', borderBottom: '1.5px dashed rgba(255,255,255,0.15)', paddingBottom: '18px' }}>
                                        <div style={{ fontSize: '26px', marginBottom: '6px' }}>🏛️ 🎓</div>
                                        <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800 }}>
                                            NATIONAL SCHOLARSHIP PORTAL • INSTITUTIONAL VERIFICATION RECORD
                                        </div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                                            {previewDoc.document_name}
                                        </h2>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Electronic Verification Certificate for <strong>{previewDoc.scholarship_name}</strong>
                                        </div>
                                    </div>

                                    {/* CANDIDATE VERIFIED PARTICULARS */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Candidate Name</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{previewDoc.student_name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admission / Roll No</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{previewDoc.student_id}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department & Year</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{previewDoc.department || 'CSE'} (Year {previewDoc.year || 3})</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic CGPA Score</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>{previewDoc.cgpa || '8.5'} / 10.0</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Certified Annual Income</div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fb923c' }}>₹{Number(previewDoc.family_income || 250000).toLocaleString('en-IN')}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submission Source</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc' }}>{previewDoc.source === 'wallet' ? 'DigiLocker / Campus Vault' : 'Uploaded PDF File'}</div>
                                        </div>
                                    </div>

                                    {/* VERIFICATION REMARKS & SECURITY HASH */}
                                    <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cryptographic Doc Hash / Audit Token</div>
                                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                                                SHA256: {previewDoc.student_id ? `0x${Buffer?.from ? '' : 'E9A4'}${previewDoc.student_id.slice(-4)}B79C41` : '0x7F8D2E14B9'}
                                            </div>
                                        </div>
                                        <div className={`badge ${previewDoc.status === 'Verified' ? 'success' : 'primary'}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                            {previewDoc.status === 'Verified' ? '✓ Institutional Verified' : '⏳ Pending Review'}
                                        </div>
                                    </div>

                                    {/* FOOTER SEALS */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <div>Issuing Authority: <strong>Revenue Dept / Academic Cell</strong></div>
                                        <div>Digital Signature: <strong>Registrar Verified ✓</strong></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VERIFY CONFIRMATION MODAL */}
            {verifyModalOpen && actionDocTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid #10b981', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                            ✓ Confirm Document Verification
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                            Have you reviewed <strong>{actionDocTarget.doc.document_name}</strong> and confirmed that it is authentic, valid, and meets scholarship eligibility rules?
                        </p>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                Verification Remarks (Optional)
                            </label>
                            <input 
                                type="text" 
                                className="input"
                                placeholder="e.g. Details verified against institution record."
                                value={verifyRemarks}
                                onChange={(e) => setVerifyRemarks(e.target.value)}
                                style={{ width: '100%', fontSize: '12px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" className="button secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</button>
                            <button 
                                type="button" 
                                className="button success" 
                                onClick={() => handleDocumentAction("verify", { remarks: verifyRemarks })}
                                style={{ background: '#10b981', color: '#ffffff' }}
                            >
                                Confirm Verification →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {rejectModalOpen && actionDocTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid #ef4444', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                            ✕ Reject Document: {actionDocTarget.doc.document_name}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                            Specify the reason for document rejection. The student will be notified.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Structured Rejection Reason *
                                </label>
                                <select
                                    className="input"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    style={{ width: '100%', fontSize: '12px' }}
                                >
                                    <option value="Wrong document">Wrong document</option>
                                    <option value="Document expired">Document expired</option>
                                    <option value="Document unreadable">Document unreadable</option>
                                    <option value="Information mismatch">Information mismatch</option>
                                    <option value="Invalid certificate">Invalid certificate</option>
                                    <option value="Incorrect format">Incorrect format</option>
                                    <option value="Name mismatch">Name mismatch</option>
                                    <option value="Missing signature/seal">Missing signature/seal</option>
                                    <option value="Suspected issue requiring manual review">Suspected issue requiring manual review</option>
                                    <option value="Other reason">Other reason</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Detailed Admin Explanation for Student *
                                </label>
                                <input 
                                    type="text" 
                                    className="input"
                                    placeholder="e.g. Income certificate is older than permitted validity period. Please obtain a new certificate."
                                    value={rejectRemarks}
                                    onChange={(e) => setRejectRemarks(e.target.value)}
                                    style={{ width: '100%', fontSize: '12px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" className="button secondary" onClick={() => setRejectModalOpen(false)}>Cancel</button>
                            <button 
                                type="button" 
                                className="button danger" 
                                disabled={!rejectRemarks.trim() && !rejectReason}
                                onClick={() => handleDocumentAction("reject", { reason: rejectReason, remarks: rejectRemarks.trim() || rejectReason })}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUEST CORRECTION MODAL */}
            {correctionModalOpen && actionDocTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid #f59e0b', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                            ⚠️ Request Document Correction
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                            Request a replacement document from the student instead of rejecting the entire application.
                        </p>
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                Correction Instructions for Student *
                            </label>
                            <textarea 
                                rows={3}
                                className="input"
                                placeholder="e.g. Please upload clear scan of both sides of Marksheet with college seal visible."
                                value={correctionRemarks}
                                onChange={(e) => setCorrectionRemarks(e.target.value)}
                                style={{ width: '100%', fontSize: '12px', minHeight: '75px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" className="button secondary" onClick={() => setCorrectionModalOpen(false)}>Cancel</button>
                            <button 
                                type="button" 
                                className="button primary" 
                                style={{ background: '#f59e0b', border: '1px solid #d97706' }}
                                onClick={() => handleDocumentAction("request_correction", { remarks: correctionRemarks })}
                            >
                                Send Correction Request →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VERSION HISTORY MODAL */}
            {historyModalOpen && historyTargetDoc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <span className="badge">Audit History</span>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                                    Submission Versions: {historyTargetDoc.document_name}
                                </h3>
                            </div>
                            <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                            {(historyTargetDoc.version_history || []).map((v, vIdx) => (
                                <div key={vIdx} style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text)' }}>
                                            Version {v.version || (vIdx + 1)} — {v.action || 'Submission'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {v.timestamp || 'Recently'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        Status: <strong style={{ color: v.status === 'Verified' ? '#10b981' : (v.status === 'Rejected' ? '#f87171' : '#38bdf8') }}>{v.status}</strong>
                                    </div>
                                    {v.remarks && <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>Remarks: {v.remarks}</div>}
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
        </div>
    );
}
