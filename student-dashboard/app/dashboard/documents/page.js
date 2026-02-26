"use client";

import { useState, useEffect } from "react";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch documents on load
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            // Mock Student ID = 1
            const res = await fetch("http://localhost:8000/documents/student/1");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Mock Student ID = 1
            const res = await fetch("http://localhost:8000/documents/upload/1", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage("Upload successful!");
                fetchDocuments(); // Refresh list
            } else {
                setMessage("Upload failed.");
            }
        } catch (error) {
            setMessage("Error uploading file.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Documents</h1>
                <div className="relative">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`btn-primary text-sm cursor-pointer inline-flex items-center gap-2 ${uploading ? 'opacity-50' : ''}`}
                    >
                        <span>{uploading ? "Uploading..." : "+ Upload New"}</span>
                    </label>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded text-sm text-center ${message.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {message}
                </div>
            )}

            {documents.length === 0 ? (
                <div className="glass p-6 rounded-2xl text-center py-12 text-text-muted">
                    <p>No documents uploaded yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {documents.map((doc) => (
                        <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border border-border-color flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-text-main">{doc.title}</h3>
                                <p className="text-xs text-text-muted text-muted">Uploaded on {doc.date}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${doc.status === "Approved" ? "bg-green-100 text-green-700" :
                                    doc.status === "Rejected" ? "bg-red-100 text-red-700" :
                                        "bg-amber-100 text-amber-700"
                                }`}>
                                {doc.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
