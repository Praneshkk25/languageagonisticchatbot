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
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white/40 p-6 rounded-2xl glass border border-white/20">
                <div>
                    <h1 className="text-3xl font-bold bg-indigo-600 bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>Digital Vault</h1>
                    <p className="text-sm text-text-muted mt-1">Manage and track your official campus documents</p>
                </div>
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
                        className={`btn-primary shadow-lg cursor-pointer inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${uploading ? 'opacity-50 grayscale' : ''}`}
                    >
                        <span className="text-xl">+</span>
                        <span className="font-bold">{uploading ? "Uploading..." : "Upload Document"}</span>
                    </label>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium animate-bounce shadow-sm ${
                    message.includes("successful") 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}>
                    <div className="flex items-center gap-2 justify-center">
                        <span>{message.includes("successful") ? "✅" : "❌"}</span>
                        {message}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.length === 0 ? (
                    <div className="col-span-full glass p-16 rounded-3xl text-center border-dashed border-2 border-indigo-100 bg-indigo-50/10">
                        <div className="text-5xl mb-4 opacity-40">📂</div>
                        <h3 className="text-lg font-semibold text-slate-500">Your vault is empty</h3>
                        <p className="text-sm text-slate-400 mt-2">Upload certificates, IDs, or forms to get started</p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.id} className="card group hover:border-primary/30 relative overflow-hidden bg-white/80 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        📄
                                    </div>
                                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                                        doc.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                                        doc.status === "Rejected" ? "bg-rose-100 text-rose-700" :
                                        "bg-amber-100 text-amber-700"
                                    }`}>
                                        {doc.status}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{doc.title}</h3>
                                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                        <span>📅</span> {doc.date}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100">View</button>
                                    <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100">Details</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
