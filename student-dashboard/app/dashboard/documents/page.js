"use client";

import { useState, useEffect } from "react";
import { Upload, File, CheckCircle, XCircle, Clock, Search, Filter, Trash2, LayoutGrid, List as ListIcon, ShieldCheck, Lock, Key, X, AlertCircle } from "lucide-react";
import { useLanguage } from "../../LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export default function DocumentsPage() {
    const { t } = useLanguage();
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [studentId, setStudentId] = useState("2023CS001");
    const [searchQuery, setSearchQuery] = useState("");

    // Double Passkey State
    const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
    const [pendingDownload, setPendingDownload] = useState(null);
    const [passkey1, setPasskey1] = useState("123456");
    const [passkey2, setPasskey2] = useState("654321");
    const [passkeyError, setPasskeyError] = useState("");
    const [passkeyVerified, setPasskeyVerified] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    if (u.id) setStudentId(u.id);
                } catch(e) {}
            }
        }
    }, []);

    const handleDownload = async (filePath, fileName) => {
        if (!filePath) return;
        if (!passkeyVerified) {
            setPendingDownload({ filePath, fileName });
            setPasskeyError("");
            setPasskeyModalOpen(true);
            return;
        }
        executeDownload(filePath, fileName);
    };

    const executeDownload = async (filePath, fileName) => {
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

    const verifyPasskeys = async () => {
        setPasskeyError("");
        try {
            const res = await fetch("http://localhost:8000/api/auth/verify-double-passkey", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: studentId,
                    passkey_1: passkey1,
                    passkey_2: passkey2
                })
            });

            if (res.ok) {
                setPasskeyVerified(true);
                setPasskeyModalOpen(false);
                if (pendingDownload) {
                    executeDownload(pendingDownload.filePath, pendingDownload.fileName);
                    setPendingDownload(null);
                }
            } else {
                const data = await res.json();
                setPasskeyError(data.detail || "Invalid Double Passkey! Check Passkey 1 and Passkey 2.");
            }
        } catch (e) {
            setPasskeyError("Error connecting to cloud vault authentication.");
        }
    };

    // Fetch documents on load
    useEffect(() => {
        if (studentId) {
            fetchDocuments(studentId);
        }
    }, [studentId]);

    const fetchDocuments = async (sId) => {
        const targetId = sId || studentId;
        try {
            const res = await fetch(`http://localhost:8000/documents/student/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
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
            const res = await fetch(`http://localhost:8000/documents/upload/${studentId}`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage("Upload successful!");
                fetchDocuments(studentId);
            } else {
                setMessage("Upload failed.");
            }
        } catch (error) {
            setMessage("Error uploading file.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            const res = await fetch(`http://localhost:8000/documents/${docId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setMessage("Document deleted successfully!");
                fetchDocuments(studentId);
            } else {
                setMessage("Failed to delete document.");
            }
        } catch (error) {
            setMessage("Error deleting document.");
        }
    };

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/40 p-10 rounded-[2.5rem] glass border border-white/20 gap-8"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Digital Vault</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Secure document management system</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            className="w-full h-12 pl-12 pr-4 bg-white/60 border border-white/40 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                            placeholder="Search files..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                    </div>
                    
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <motion.label
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            htmlFor="file-upload"
                            className={`h-12 bg-primary text-white shadow-xl shadow-primary/20 cursor-pointer inline-flex items-center gap-3 px-8 rounded-2xl transition-all ${uploading ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                        >
                            <Upload className="w-4 h-4" />
                            <span className="font-black text-xs uppercase tracking-widest">{uploading ? "..." : "Upload"}</span>
                        </motion.label>
                    </div>
                </div>
            </motion.div>

            {/* Notification */}
            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`overflow-hidden`}
                    >
                        <div className={`p-5 rounded-3xl text-sm font-bold shadow-sm ${
                            message.includes("successful") 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                            <div className="flex items-center gap-3 justify-center uppercase tracking-widest text-[11px]">
                                {message.includes("successful") ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {message}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {documents.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-full glass p-20 rounded-[3rem] text-center border-none bg-gradient-to-br from-slate-50/50 to-white/30 backdrop-blur-2xl shadow-2xl"
                    >
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 transform -rotate-12">
                            <File className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            {searchQuery ? "No matching files found" : "Your vault is empty"}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto leading-relaxed italic">
                            {searchQuery ? "Try searching for a different keyword." : "Upload your certificates, ID cards, or official forms to keep them safe and accessible."}
                        </p>
                    </motion.div>
                ) : (
                    documents
                        .filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((doc, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={doc.id} 
                            className="glass group p-8 rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/60 relative overflow-hidden"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
                                        <File className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm ${
                                            doc.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                            doc.status === "Rejected" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                            "bg-amber-50 text-amber-600 border border-amber-100"
                                        }`}>
                                            {doc.status}
                                        </span>
                                        <button 
                                            onClick={() => handleDelete(doc.id)} 
                                            className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                                            title="Delete Document"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-black text-slate-700 tracking-tight group-hover:text-primary transition-colors line-clamp-1">{doc.title}</h3>
                                    <div className="flex items-center gap-4 mt-3">
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                                            <Clock className="w-3.5 h-3.5" /> {doc.date}
                                        </p>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF</p>
                                    </div>
                                    {doc.status === "Rejected" && doc.feedback && (
                                        <div className="mt-3.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100/50 text-[11px] font-bold text-rose-600 leading-normal">
                                            ⚠️ Reason: "{doc.feedback}"
                                        </div>
                                    )}
                                </div>
                                
                                <div className="pt-6 border-t border-white/40 flex flex-wrap gap-4">
                                    <button 
                                        disabled={!doc.file_path}
                                        onClick={() => window.open(`http://localhost:8000${doc.file_path}`, "_blank")}
                                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Preview
                                    </button>
                                    <button 
                                        disabled={!doc.file_path}
                                        onClick={() => handleDownload(doc.file_path, doc.title)}
                                        className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Download
                                    </button>
                                    
                                    {doc.status === "Rejected" && (
                                        <div className="w-full mt-2 relative">
                                            <input
                                                type="file"
                                                id={`reupload-${doc.id}`}
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    
                                                    setUploading(true);
                                                    setMessage("Re-uploading and replacing...");
                                                    
                                                    try {
                                                        // Delete the old rejected document entry
                                                        await fetch(`http://localhost:8000/documents/${doc.id}`, { method: "DELETE" });
                                                        
                                                        // Upload the replacement file
                                                        const formData = new FormData();
                                                        formData.append("file", file);
                                                        const res = await fetch(`http://localhost:8000/documents/upload/${studentId}`, {
                                                            method: "POST",
                                                            body: formData,
                                                        });
                                                        
                                                        if (res.ok) {
                                                            setMessage("Re-upload successful!");
                                                            fetchDocuments(studentId);
                                                        } else {
                                                            setMessage("Re-upload failed.");
                                                        }
                                                    } catch (err) {
                                                        console.error("Re-upload error:", err);
                                                        setMessage("Error replacing document.");
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={`reupload-${doc.id}`}
                                                className="w-full h-12 text-[10px] font-black uppercase tracking-widest rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer shadow-lg transition-all"
                                            >
                                                Replace Rejected File
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Decorative background shape */}
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* DOUBLE PASSKEY MODAL FOR CLOUD VAULT */}
            <AnimatePresence>
                {passkeyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden text-slate-800"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 font-display">Cloud Storage Vault Security</h3>
                                        <p className="text-[11px] font-bold text-slate-400">Double Passkey Authorization Required</p>
                                    </div>
                                </div>
                                <button onClick={() => setPasskeyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed bg-teal-50/60 border border-teal-100 p-3.5 rounded-2xl">
                                🔒 Accessing cloud-stored certificates & application forms requires <strong>Double Passkey</strong> verification (Passkey 1 & Passkey 2).
                            </p>

                            {passkeyError && (
                                <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{passkeyError}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-extrabold text-slate-700 block mb-1">
                                        🔑 Passkey 1 (Primary Student Key)
                                    </label>
                                    <input 
                                        type="password"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-teal-500/20"
                                        placeholder="Enter Passkey 1"
                                        value={passkey1}
                                        onChange={(e) => setPasskey1(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-extrabold text-slate-700 block mb-1">
                                        🔐 Passkey 2 (Cloud Vault Key)
                                    </label>
                                    <input 
                                        type="password"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-teal-500/20"
                                        placeholder="Enter Passkey 2"
                                        value={passkey2}
                                        onChange={(e) => setPasskey2(e.target.value)}
                                    />
                                </div>

                                <div className="bg-slate-100 p-3 rounded-xl text-[11px] text-slate-500 font-mono">
                                    💡 <strong>Demo Passkeys:</strong> Passkey 1: <code>123456</code> | Passkey 2: <code>654321</code>
                                </div>
                            </div>

                            <button
                                onClick={verifyPasskeys}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                            >
                                <Key className="w-4 h-4 text-teal-400" />
                                <span>Verify Double Passkey & Access Vault</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
