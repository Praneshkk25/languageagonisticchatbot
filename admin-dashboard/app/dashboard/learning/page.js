"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadCloud, BrainCircuit, FileSpreadsheet, BookOpen, File, CheckCircle2 } from "lucide-react";

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
            console.error("Failed to fetch status:", error);
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
        <div className="space-y-8 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-extrabold mb-1 tracking-tight" style={{ letterSpacing: "-0.035em" }}>Knowledge Base</h1>
                <p className="text-muted font-semibold text-sm">Upload campus logs, PDFs, and textbooks to train the AI assistant.</p>
            </div>

            {/* Upload Section */}
            <div className="card p-8 flex flex-col items-center justify-center text-center" style={{ border: '2px dashed rgba(0,0,0,0.06)', background: 'rgba(255, 255, 255, 0.4)' }}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                    <UploadCloud className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="font-extrabold text-lg mb-1" style={{ fontWeight: 800 }}>Upload learning materials</h3>
                <p className="text-xs text-slate-400 font-semibold mb-6 max-w-sm leading-relaxed">
                    Select official guides, course schedules, or student handbooks. Supports PDF, DOCX, TXT (Max 10MB)
                </p>
                <input
                    type="file"
                    id="kb-file-upload"
                    accept=".pdf,.docx,.txt"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                />
                <label 
                    htmlFor="kb-file-upload"
                    className="btn-primary cursor-pointer text-xs font-black uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                    {uploading ? "Processing file..." : "Select File"}
                </label>
                
                {message && (
                    <div 
                        className="mt-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider border"
                        style={{
                            background: message.includes("Success") ? "rgba(16, 185, 129, 0.05)" : "rgba(255, 95, 54, 0.05)",
                            borderColor: message.includes("Success") ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 95, 54, 0.15)",
                            color: message.includes("Success") ? "var(--success)" : "var(--primary)"
                        }}
                    >
                        {message}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 flex items-center justify-between" style={{ border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.75)' }}>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Chunks Learned</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1" style={{ fontWeight: 800 }}>{status.total_chunks}</h3>
                    </div>
                    <div className="p-3.5 bg-primary/10 rounded-2xl text-primary" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                </div>
                
                <div className="card p-6 flex items-center justify-between" style={{ border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.75)' }}>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documents Processed</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1" style={{ fontWeight: 800 }}>{status.files.length}</h3>
                    </div>
                    <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-700">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* File List */}
            <div className="card p-6" style={{ background: 'rgba(255,255,255,0.75)' }}>
                <h3 className="font-extrabold text-lg mb-6 flex items-center gap-2" style={{ fontWeight: 800 }}>
                    <BookOpen className="w-5 h-5 text-primary" />
                    Learned Documents
                </h3>
                {status.files.length === 0 ? (
                    <p className="text-slate-400 text-center py-8 text-sm font-semibold italic">No documents trained yet.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {status.files.map((file, idx) => (
                            <div 
                                key={idx}
                                className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl hover:translate-x-1 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                                        <File className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{file}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Processed successfully</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest">Learned</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
