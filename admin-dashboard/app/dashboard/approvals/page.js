"use client";

import { useState } from "react";

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState([
        { id: "1", student_id: "2023CS001", doc_type: "Medical Certificate", date: "2026-03-15", status: "Pending" },
        { id: "2", student_id: "2023EC045", doc_type: "Scholarship Form", date: "2026-03-14", status: "Pending" },
        { id: "3", student_id: "2023ME012", doc_type: "Bus Pass Request", date: "2026-03-13", status: "Approved" },
    ]);

    const handleAction = (id, action) => {
        setApprovals(prev => prev.map(app => 
            app.id === id ? { ...app, status: action === 'approve' ? 'Approved' : 'Rejected' } : app
        ));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Document Approvals</h1>
                <div className="flex gap-2">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">2 Pending</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">1 Approved</span>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-white/20">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Document Type</th>
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
                                    <td>{item.doc_type}</td>
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
                                            <button className="btn-secondary text-xs py-1 px-3">View</button>
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
