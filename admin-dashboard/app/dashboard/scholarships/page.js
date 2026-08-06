"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Save, Trash2, Plus, RefreshCw, AlertCircle, Sparkles, Building, Calendar, Wallet } from "lucide-react";

export default function ScholarshipsManager() {
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Form inputs for a new scholarship
    const [newScholarship, setNewScholarship] = useState({
        scholarship_name: "",
        min_gpa: 8.0,
        max_income: 250000,
        eligible_departments: "CSE, ECE, IT",
        eligible_years: "2, 3, 4"
    });

    const fetchScholarships = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/scholarships/all");
            if (res.ok) {
                const data = await res.json();
                setScholarships(data);
            }
        } catch (error) {
            console.error("Failed to fetch scholarships:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScholarships();
    }, []);

    const showMessage = (msg) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(""), 4000);
    };

    const handleSave = async (item) => {
        try {
            // Process departments and years strings into arrays
            const eligible_departments = typeof item.eligible_departments === "string"
                ? item.eligible_departments.split(",").map(d => d.trim().toUpperCase()).filter(Boolean)
                : item.eligible_departments;

            const eligible_years = typeof item.eligible_years === "string"
                ? item.eligible_years.split(",").map(y => parseInt(y.trim())).filter(y => !isNaN(y))
                : item.eligible_years;

            const payload = {
                ...item,
                eligible_departments,
                eligible_years,
                min_gpa: parseFloat(item.min_gpa),
                max_income: parseFloat(item.max_income)
            };

            const res = await fetch(`http://localhost:8000/api/scholarships/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showMessage("Scholarship criteria updated successfully!");
                fetchScholarships();
            } else {
                showMessage("Failed to update scholarship criteria.");
            }
        } catch (error) {
            showMessage("Network error during save operation.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this scholarship? This is irreversible.")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/scholarships/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                showMessage("Scholarship deleted successfully.");
                fetchScholarships();
            } else {
                showMessage("Failed to delete scholarship.");
            }
        } catch (error) {
            showMessage("Network error during deletion.");
        }
    };

    const handleCreate = async () => {
        if (!newScholarship.scholarship_name.trim()) {
            alert("Please enter a scholarship name.");
            return;
        }

        try {
            const eligible_departments = newScholarship.eligible_departments
                .split(",")
                .map(d => d.trim().toUpperCase())
                .filter(Boolean);

            const eligible_years = newScholarship.eligible_years
                .split(",")
                .map(y => parseInt(y.trim()))
                .filter(y => !isNaN(y));

            const payload = {
                scholarship_name: newScholarship.scholarship_name,
                min_gpa: parseFloat(newScholarship.min_gpa),
                max_income: parseFloat(newScholarship.max_income),
                eligible_departments,
                eligible_years
            };

            const res = await fetch("http://localhost:8000/api/scholarships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showMessage("Scholarship created successfully!");
                setIsCreating(false);
                setNewScholarship({
                    scholarship_name: "",
                    min_gpa: 8.0,
                    max_income: 250000,
                    eligible_departments: "CSE, ECE, IT",
                    eligible_years: "2, 3, 4"
                });
                fetchScholarships();
            } else {
                showMessage("Failed to create scholarship.");
            }
        } catch (error) {
            showMessage("Network error during creation.");
        }
    };

    const handleFieldChange = (idx, field, value) => {
        setScholarships(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            return updated;
        });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Title */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1 tracking-tight" style={{ letterSpacing: "-0.035em" }}>Scholarship Criteria Manager</h1>
                    <p className="text-muted font-semibold text-sm">View, edit, or create structured eligibility rules for the conversational AI engine.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchScholarships} 
                        className="p-3 bg-white/80 border border-slate-200/50 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 cursor-pointer"
                        style={{ background: 'var(--orange-grad)' }}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New</span>
                    </button>
                </div>
            </div>

            {actionMsg && (
                <div className="p-4 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-2xl border border-emerald-100/50 animate-pulse">
                    {actionMsg}
                </div>
            )}

            {/* Create New Scholarship section (AnimatePresence) */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="card p-6 border-2 border-primary/20 bg-primary/5 rounded-3xl overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-base flex items-center gap-2" style={{ fontWeight: 800 }}>
                                <Sparkles className="w-5 h-5 text-primary" />
                                Add Custom Scholarship Rules
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase">Cancel</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Scholarship Name</label>
                                <input 
                                    type="text" 
                                    className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                                    placeholder="e.g. Sona Merit Scholarship"
                                    value={newScholarship.scholarship_name}
                                    onChange={(e) => setNewScholarship({...newScholarship, scholarship_name: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Minimum GPA</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                                    value={newScholarship.min_gpa}
                                    onChange={(e) => setNewScholarship({...newScholarship, min_gpa: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Max Family Income Limit (₹)</label>
                                <input 
                                    type="number" 
                                    className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                                    value={newScholarship.max_income}
                                    onChange={(e) => setNewScholarship({...newScholarship, max_income: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Eligible Departments (Comma-separated)</label>
                                <input 
                                    type="text" 
                                    className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                                    placeholder="e.g. CSE, ECE, IT"
                                    value={newScholarship.eligible_departments}
                                    onChange={(e) => setNewScholarship({...newScholarship, eligible_departments: e.target.value})}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Eligible Academic Years (Comma-separated)</label>
                                <input 
                                    type="text" 
                                    className="bg-white border border-slate-200/80 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
                                    placeholder="e.g. 2, 3, 4"
                                    value={newScholarship.eligible_years}
                                    onChange={(e) => setNewScholarship({...newScholarship, eligible_years: e.target.value})}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleCreate}
                            className="btn-primary py-3.5 px-6 text-xs uppercase font-black tracking-wider"
                        >
                            Submit Scholarship
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Grid */}
            {loading ? (
                <div className="text-center py-16">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading stored scholarship rules...</p>
                </div>
            ) : scholarships.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {scholarships.map((item, idx) => (
                        <motion.div 
                            key={item.id || idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="card p-6 flex flex-col justify-between overflow-hidden relative border border-white/70"
                            style={{ background: 'rgba(255, 255, 255, 0.75)' }}
                        >
                            <div>
                                {/* Card Title Section */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 leading-snug" style={{ fontWeight: 800 }}>
                                                {item.scholarship_name}
                                            </h3>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {item.id}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-slate-100/50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                                        title="Delete Scholarship"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Form Fields inputs for edit */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            Minimum CGPA
                                        </span>
                                        <input 
                                            type="number"
                                            step="0.1"
                                            className="bg-slate-50/50 border border-slate-200/40 focus:bg-white focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-slate-700 outline-none"
                                            value={item.min_gpa}
                                            onChange={(e) => handleFieldChange(idx, "min_gpa", e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Wallet className="w-3 h-3 text-emerald-500" />
                                            Income Limit (₹)
                                        </span>
                                        <input 
                                            type="number"
                                            className="bg-slate-50/50 border border-slate-200/40 focus:bg-white focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-slate-700 outline-none"
                                            value={item.max_income}
                                            onChange={(e) => handleFieldChange(idx, "max_income", e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Building className="w-3 h-3 text-indigo-500" />
                                            Eligible Depts
                                        </span>
                                        <input 
                                            type="text"
                                            className="bg-slate-50/50 border border-slate-200/40 focus:bg-white focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-slate-700 outline-none"
                                            value={Array.isArray(item.eligible_departments) ? item.eligible_departments.join(", ") : item.eligible_departments}
                                            onChange={(e) => handleFieldChange(idx, "eligible_departments", e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-orange-500" />
                                            Eligible Years
                                        </span>
                                        <input 
                                            type="text"
                                            className="bg-slate-50/50 border border-slate-200/40 focus:bg-white focus:border-primary rounded-xl p-2.5 text-xs font-semibold text-slate-700 outline-none"
                                            value={Array.isArray(item.eligible_years) ? item.eligible_years.join(", ") : item.eligible_years}
                                            onChange={(e) => handleFieldChange(idx, "eligible_years", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleSave(item)}
                                className="btn-secondary flex items-center justify-center gap-2 text-xs py-3 px-4 rounded-xl border border-slate-200 shadow-sm font-bold w-full transition-transform active:scale-[0.98]"
                            >
                                <Save className="w-3.5 h-3.5 text-primary" />
                                <span>Save Changes</span>
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="card p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-bold mb-1">No Scholarship Rules Found</p>
                    <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
                        Upload official scholarship brochures in the Knowledge Base tab or click 'Create New' above to write rules.
                    </p>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="btn-primary py-3 px-6 text-xs uppercase font-black tracking-wider"
                    >
                        Create One Now
                    </button>
                </div>
            )}
        </div>
    );
}
