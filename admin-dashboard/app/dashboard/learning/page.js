"use client";

import { useState, useEffect } from "react";

export default function LearningPage() {
    const [status, setStatus] = useState({ total_chunks: 0, files: [] });
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const fetchStatus = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/learn/status");
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch status", error);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage("Uploading and processing...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:8000/admin/learn/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(`Success: ${data.message}`);
                fetchStatus();
            } else {
                setMessage(`Error: ${data.detail}`);
            }
        } catch (error) {
            setMessage("Network error during upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Knowledge Base</h1>
                    <p className="text-text-muted text-sm">Upload documents to train the AI assistant</p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
                <h3 className="font-semibold mb-4">Add New Knowledge</h3>
                <div className="flex gap-4 items-center">
                    <input
                        type="file"
                        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                    />
                    {uploading && <span className="text-sm text-indigo-600 animate-pulse">Processing...</span>}
                </div>
                {message && (
                    <div className={`mt-4 p-3 rounded text-sm ${message.includes("Success") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="stat-card bg-indigo-50 border-indigo-100">
                    <div className="stat-label text-indigo-600">Total Chunks Learned</div>
                    <div className="stat-value text-indigo-900">{status.total_chunks}</div>
                </div>
                <div className="stat-card bg-orange-50 border-orange-100">
                    <div className="stat-label text-orange-600">Documents Processed</div>
                    <div className="stat-value text-orange-900">{status.files.length}</div>
                </div>
            </div>

            {/* File List */}
            <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
                <h3 className="font-semibold mb-4">Learned Documents</h3>
                {status.files.length === 0 ? (
                    <p className="text-text-muted text-center py-4">No documents learned yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {status.files.map((file, idx) => (
                            <li key={idx} className="py-2 text-sm text-slate-700 flex items-center gap-2">
                                <span>📄</span> {file}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
