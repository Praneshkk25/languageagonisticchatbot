"use client";

import { useState, useEffect } from "react";

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState([]);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            const res = await fetch("http://localhost:8000/documents/admin/all");
            if (res.ok) {
                const data = await res.json();
                setApprovals(data);
            }
        } catch (error) {
            console.error("Failed to fetch approvals:", error);
        }
    };

    const handleAction = async (id, action) => {
        let payload = null;
        if (action === 'reject') {
            const reason = prompt("Please provide a feedback reason for rejecting this document:");
            if (reason === null) return;
            if (!reason.trim()) {
                alert("A rejection reason is required.");
                return;
            }
            payload = { reason: reason.trim() };
        }

        try {
            const headers = {};
            let body = undefined;
            if (payload) {
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(payload);
            }

            const res = await fetch(`http://localhost:8000/documents/${action}/${id}`, {
                method: "POST",
                headers,
                body
            });
            if (res.ok) {
                fetchApprovals();
            } else {
                console.error(`Failed to ${action} document`);
            }
        } catch (error) {
            console.error(`Error during ${action}:`, error);
        }
    };

    const handleDownload = async (filePath, fileName) => {
        if (!filePath) return;
        try {
            const res = await fetch(`http://localhost:8000${filePath}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'download';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Document Approvals</h1>
                <div className="flex gap-2">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {approvals.filter(app => app.status === "Pending").length} Pending
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {approvals.filter(app => app.status === "Approved").length} Approved
                    </span>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-white/20">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Document Title / Type</th>
                                <th>Submission Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvals.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <span className="font-semibold text-primary">{item.student_id}</span>
                                    </td>
                                    <td>
                                        <div>{item.title || item.doc_type || 'Unknown Document'}</div>
                                        {item.status === "Rejected" && item.feedback && (
                                            <div className="text-[10px] text-rose-600 font-bold mt-1">Reason: "{item.feedback}"</div>
                                        )}
                                    </td>
                                    <td className="text-text-muted">{item.date}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            item.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                            item.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                                            "bg-rose-100 text-rose-700"
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button 
                                                disabled={!item.file_path}
                                                onClick={() => window.open(`http://localhost:8000${item.file_path}`, "_blank")}
                                                className="btn-secondary text-xs py-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Preview
                                            </button>
                                            <button 
                                                disabled={!item.file_path}
                                                onClick={() => handleDownload(item.file_path, item.title)}
                                                className="btn-secondary text-xs py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Download
                                            </button>
                                            {item.status === "Pending" && (
                                                <>
                                                    <button 
                                                        onClick={() => handleAction(item.id, 'approve')}
                                                        className="btn-success text-xs py-1 px-3"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(item.id, 'reject')}
                                                        className="btn-danger text-xs py-1 px-3"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
