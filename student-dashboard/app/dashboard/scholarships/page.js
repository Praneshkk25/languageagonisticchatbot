"use client";

import { useState, useEffect } from "react";
import { 
    Search, GraduationCap, CheckCircle2, ShieldCheck, Download, ExternalLink, 
    FileText, Lock, Key, Award, AlertCircle, Sparkles, Filter, ChevronRight, X, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScholarshipsPage() {
    const [categories, setCategories] = useState([]);
    const [scholarships, setScholarships] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null); // null = All
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedScholarship, setSelectedScholarship] = useState(null);
    const [checkedDocs, setCheckedDocs] = useState({});
    
    // Student Profile State
    const [studentProfile, setStudentProfile] = useState({
        id: "2023CS001",
        name: "Student Demo",
        cgpa: 9.2,
        department: "CSE",
        year: 3,
        family_income: 250000.0
    });

    // Double Passkey State
    const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
    const [targetScholarshipForDownload, setTargetScholarshipForDownload] = useState(null);
    const [passkey1, setPasskey1] = useState("123456");
    const [passkey2, setPasskey2] = useState("654321");
    const [passkeyError, setPasskeyError] = useState("");
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [passkeyVerifiedSession, setPasskeyVerifiedSession] = useState(false);
    const [downloadSuccessMessage, setDownloadSuccessMessage] = useState("");
    const [eligibilityResultModal, setEligibilityResultModal] = useState(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    if (u.id) {
                        fetchStudentProfile(u.id);
                    }
                } catch(e) {}
            }
        }
        fetchCategories();
        fetchAllScholarships();
    }, []);

    const fetchStudentProfile = async (sId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/students/${sId}`);
            if (res.ok) {
                const data = await res.json();
                setStudentProfile(prev => ({ ...prev, ...data, id: sId }));
            }
        } catch (e) {
            console.error("Failed to fetch student profile:", e);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/scholarships/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) {
            console.error("Failed to fetch scholarship categories:", e);
        }
    };

    const fetchAllScholarships = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/scholarships/all");
            if (res.ok) {
                const data = await res.json();
                setScholarships(data);
            }
        } catch (e) {
            console.error("Failed to fetch scholarships:", e);
        }
    };

    const handleCategoryClick = (catId) => {
        if (selectedCategory !== null && String(selectedCategory) === String(catId)) {
            setSelectedCategory(null); // Toggle off
        } else {
            setSelectedCategory(catId);
        }
    };

    const handleCheckEligibility = (sch) => {
        const cgpa = studentProfile.cgpa;
        const income = studentProfile.family_income;
        const dept = studentProfile.department;
        const year = studentProfile.year;

        const checks = [];
        let isEligible = true;

        if (sch.min_gpa) {
            const pass = cgpa >= sch.min_gpa;
            checks.push({ label: `Minimum CGPA (${sch.min_gpa}+)`, val: `Your CGPA: ${cgpa}`, pass });
            if (!pass) isEligible = false;
        }

        if (sch.max_income) {
            const pass = income <= sch.max_income;
            checks.push({ label: `Max Family Income (₹${(sch.max_income/100000).toFixed(1)} Lakhs)`, val: `Your Income: ₹${(income/100000).toFixed(1)} Lakhs`, pass });
            if (!pass) isEligible = false;
        }

        if (sch.eligible_departments && sch.eligible_departments.length > 0 && !sch.eligible_departments.includes("ALL")) {
            const pass = sch.eligible_departments.includes(dept);
            checks.push({ label: `Eligible Departments (${sch.eligible_departments.join(", ")})`, val: `Your Dept: ${dept}`, pass });
            if (!pass) isEligible = false;
        }

        if (sch.eligible_years && sch.eligible_years.length > 0) {
            const pass = sch.eligible_years.includes(year);
            checks.push({ label: `Eligible Academic Years (${sch.eligible_years.join(", ")})`, val: `Your Year: Year ${year}`, pass });
            if (!pass) isEligible = false;
        }

        setEligibilityResultModal({
            scholarship_name: sch.scholarship_name,
            isEligible,
            checks
        });
    };

    const triggerFormDownload = (sch) => {
        setTargetScholarshipForDownload(sch);
        if (passkeyVerifiedSession) {
            // Already verified in session
            executeFormDownload(sch, passkey1, passkey2);
        } else {
            setPasskeyError("");
            setPasskeyModalOpen(true);
        }
    };

    const executeFormDownload = async (sch, p1, p2) => {
        setPasskeyLoading(true);
        setPasskeyError("");
        try {
            const res = await fetch("http://localhost:8000/api/scholarships/download-form", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: studentProfile.id,
                    scholarship_id: sch.id,
                    passkey_1: p1,
                    passkey_2: p2
                })
            });

            const data = await res.json();
            if (res.ok && data.download_url) {
                setPasskeyVerifiedSession(true);
                setPasskeyModalOpen(false);
                setDownloadSuccessMessage(`Successfully authenticated! Form downloaded for ${sch.scholarship_name}.`);

                // Trigger actual PDF file download
                const link = document.createElement("a");
                link.href = `http://localhost:8000${data.download_url}`;
                link.download = data.filename || `${sch.id}_form.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => setDownloadSuccessMessage(""), 6000);
            } else {
                setPasskeyError(data.detail || "Invalid Double Passkey. Please verify Passkey 1 and Passkey 2.");
            }
        } catch (e) {
            setPasskeyError("Error verifying Double Passkey or connecting to cloud backend.");
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleDocCheckToggle = (schId, docIndex) => {
        setCheckedDocs(prev => ({
            ...prev,
            [`${schId}_${docIndex}`]: !prev[`${schId}_${docIndex}`]
        }));
    };

    // Filter Logic
    const filteredScholarships = scholarships.filter(s => {
        const matchesCategory = selectedCategory === null || String(s.category_id) === String(selectedCategory);
        const matchesQuery = !searchQuery || 
            (s.scholarship_name && s.scholarship_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.category_name && s.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesQuery;
    });

    return (
        <div className="space-y-10 pb-16">
            {/* Download Notification Banner */}
            <AnimatePresence>
                {downloadSuccessMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm px-6"
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6" />
                            <span>{downloadSuccessMessage}</span>
                        </div>
                        <button onClick={() => setDownloadSuccessMessage("")} className="hover:opacity-80">
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Header Banner */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl border border-teal-500/20"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black tracking-wide uppercase">
                            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                            <span>Indian Undergraduate Scholarships Hub</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-display">
                            14 Categories of Scholarships for Graduation
                        </h1>
                        <p className="text-teal-100/80 text-sm font-medium leading-relaxed">
                            Explore Central & State Govt. schemes, AICTE grants, SC/ST/OBC/Minority quotas, Merit & Need-based funding, Girls & PwD aid, Corporate awards, and Interest Subsidies. Choose a scholarship to get full details, necessary documents checklist, and download required application forms!
                        </p>
                    </div>

                    {/* Double Passkey Cloud Security Status Card */}
                    <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 text-left min-w-[280px]">
                        <div className="flex items-center gap-2 text-teal-300 font-extrabold text-xs uppercase tracking-wider mb-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Cloud Storage Vault Protection</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/90 font-bold mb-3">
                            <span>Double Passkey Status:</span>
                            {passkeyVerifiedSession ? (
                                <span className="bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-400/40">Verified</span>
                            ) : (
                                <span className="bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/40">Protected</span>
                            )}
                        </div>
                        <p className="text-[11px] text-teal-100/70 mb-3">
                            Cloud stored application forms & documents require 2-Factor Double Passkey authorization.
                        </p>
                        <button 
                            onClick={() => { setPasskeyError(""); setPasskeyModalOpen(true); }}
                            className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span>{passkeyVerifiedSession ? "Manage Double Passkeys" : "Enter Double Passkeys"}</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Search & Filter Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/60 p-4 rounded-3xl glass border border-white/40">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-teal-500/20 transition-all text-slate-800"
                        placeholder="Search by scholarship name, portal, category, or criteria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 w-full md:w-auto justify-end">
                    <Filter className="w-4 h-4 text-teal-600" />
                    <span>Active Filter: {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "All 14 Categories"}</span>
                    {selectedCategory && (
                        <button 
                            onClick={() => setSelectedCategory(null)}
                            className="ml-2 text-rose-500 hover:underline font-extrabold"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {/* 14 Categories Interactive Grid */}
            <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                    <span>Browse by 14 Scholarship Categories</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <motion.button
                                key={cat.id}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between h-28 relative overflow-hidden ${
                                    isSelected 
                                    ? "bg-teal-600 text-white border-teal-500 shadow-xl shadow-teal-600/20" 
                                    : "bg-white/80 hover:bg-white text-slate-700 border-slate-200/70 shadow-sm hover:shadow-md"
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-xl">{cat.icon || "🎓"}</span>
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                    }`}>
                                        #{cat.id}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-black leading-tight line-clamp-2">{cat.name}</h4>
                                    <p className={`text-[9px] font-bold mt-1 ${isSelected ? "text-teal-100" : "text-teal-600"}`}>
                                        {cat.scholarship_count || 1} Available
                                    </p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Scholarships List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                        Available Scholarships ({filteredScholarships.length})
                    </h3>
                    <span className="text-xs font-bold text-slate-400">
                        Select a scholarship to get criteria, documents & application form
                    </span>
                </div>

                {filteredScholarships.length === 0 ? (
                    <div className="bg-white/60 p-12 rounded-3xl text-center border border-dashed border-slate-300">
                        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-bold text-slate-700">No scholarships matched your filter</h4>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting a different category.</p>
                        <button 
                            onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-md"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredScholarships.map((sch) => (
                            <motion.div
                                key={sch.id}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between space-y-5"
                            >
                                <div className="space-y-4">
                                    {/* Category Pill Tag */}
                                    <div>
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-wider border border-teal-200/80">
                                            {sch.category_name || "Undergraduate Scholarship"}
                                        </div>
                                    </div>

                                    {/* Eligible Category / Quota Box */}
                                    {sch.caste_category && (
                                        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                                                Eligible Category / Quota
                                            </p>
                                            <p className="text-xs font-bold text-slate-800 leading-normal">
                                                {sch.caste_category}
                                            </p>
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h4 className="text-lg font-black text-slate-900 leading-snug font-display">
                                        {sch.scholarship_name}
                                    </h4>

                                    {/* Description */}
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                        {sch.description}
                                    </p>

                                    {/* Benefits Box */}
                                    <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl">
                                        <p className="text-xs font-black text-emerald-800 uppercase tracking-wider block mb-1">
                                            Financial Benefit & Coverage
                                        </p>
                                        <p className="text-xs font-black text-emerald-950 leading-normal">
                                            {sch.benefits}
                                        </p>
                                    </div>

                                    {/* Criteria Badges */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                                        {sch.min_gpa && (
                                            <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60 inline-flex items-center gap-1.5">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Min CGPA:</span>
                                                <span className="font-extrabold text-teal-700">{sch.min_gpa}</span>
                                            </div>
                                        )}
                                        {sch.max_income && (
                                            <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60 inline-flex items-center gap-1.5">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Max Income:</span>
                                                <span className="font-extrabold text-teal-700">₹{(sch.max_income/100000).toFixed(1)} Lakhs</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            onClick={() => setSelectedScholarship(sch)}
                                            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-teal-400" />
                                            <span>View Details</span>
                                        </button>

                                        <button
                                            onClick={() => handleCheckEligibility(sch)}
                                            className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                            <span>Check Profile</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => triggerFormDownload(sch)}
                                        className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download Application Form</span>
                                        <Lock className="w-3.5 h-3.5 text-teal-200 ml-auto" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* SCHOLARSHIP DETAIL MODAL */}
            <AnimatePresence>
                {selectedScholarship && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col my-auto relative"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-900 text-white p-6 md:p-8 relative shrink-0">
                                <button 
                                    onClick={() => setSelectedScholarship(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-800 inline-block mb-3">
                                    {selectedScholarship.category_name}
                                </span>

                                <h2 className="text-2xl md:text-3xl font-black font-display leading-tight pr-10">
                                    {selectedScholarship.scholarship_name}
                                </h2>

                                {selectedScholarship.official_portal && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mt-2">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>Official Portal: {selectedScholarship.official_portal}</span>
                                    </div>
                                )}
                            </div>

                            {/* Modal Scrollable Body */}
                            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 max-h-[calc(85vh-180px)]">
                                {/* Description */}
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Overview</h4>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                        {selectedScholarship.description}
                                    </p>
                                </div>

                                {/* Financial Benefits */}
                                <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-emerald-600" />
                                        <span>Benefits & Scholarship Amount</span>
                                    </h4>
                                    <p className="text-sm font-black text-emerald-950">
                                        {selectedScholarship.benefits}
                                    </p>
                                </div>

                                {/* Eligibility Criteria Grid */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Eligibility Criteria</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedScholarship.min_gpa && (
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                <span className="text-[10px] font-bold text-slate-400 block">Min CGPA</span>
                                                <span className="text-sm font-black text-slate-800">{selectedScholarship.min_gpa} / 10.0</span>
                                            </div>
                                        )}
                                        {selectedScholarship.max_income && (
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                <span className="text-[10px] font-bold text-slate-400 block">Max Income Limit</span>
                                                <span className="text-sm font-black text-slate-800">₹{(selectedScholarship.max_income/100000).toFixed(1)} Lakhs / yr</span>
                                            </div>
                                        )}
                                        {selectedScholarship.caste_category && (
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                <span className="text-[10px] font-bold text-slate-400 block">Category</span>
                                                <span className="text-sm font-black text-slate-800">{selectedScholarship.caste_category}</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedScholarship.academic_criteria && (
                                        <p className="text-xs font-bold text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-100 mt-2">
                                            Academic Requirement: {selectedScholarship.academic_criteria}
                                        </p>
                                    )}
                                </div>

                                {/* MANDATORY NECESSARY DOCUMENTS CHECKLIST */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-teal-600" />
                                            <span>Necessary Documents Needed (Mandatory Checklist)</span>
                                        </h4>
                                        <span className="text-[10px] font-bold text-slate-400">Check off as you collect</span>
                                    </div>

                                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        {(selectedScholarship.necessary_documents || [
                                            "Class 10th & 12th Marksheet",
                                            "Aadhaar Card of Student",
                                            "Annual Family Income Certificate",
                                            "College Bonafide Certificate",
                                            "Bank Account Passbook Copy"
                                        ]).map((docItem, idx) => {
                                            const isChecked = !!checkedDocs[`${selectedScholarship.id}_${idx}`];
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => handleDocCheckToggle(selectedScholarship.id, idx)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                                                        isChecked ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300"
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                                                        isChecked ? "bg-emerald-600 text-white" : "border-2 border-slate-300"
                                                    }`}>
                                                        {isChecked && "✓"}
                                                    </div>
                                                    <span className="text-xs font-bold leading-tight">{docItem}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Lock className="w-4 h-4 text-teal-600" />
                                    <span>Cloud Storage Double Passkey required for PDF form download</span>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => setSelectedScholarship(null)}
                                        className="py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const sch = selectedScholarship;
                                            setSelectedScholarship(null);
                                            triggerFormDownload(sch);
                                        }}
                                        className="py-3 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/20 flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Download Application Form</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DOUBLE PASSKEY SECURITY VERIFICATION MODAL */}
            <AnimatePresence>
                {passkeyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 font-display">Double Passkey Required</h3>
                                        <p className="text-[11px] font-bold text-slate-400">Cloud Storage Security Verification</p>
                                    </div>
                                </div>
                                <button onClick={() => setPasskeyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed bg-teal-50/60 border border-teal-100 p-3.5 rounded-2xl">
                                🔒 For security of student records in cloud storage, enter your <strong>Double Passkeys</strong> (Passkey 1 & Passkey 2) to authorize downloading official forms.
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
                                        🔑 Passkey 1 (Primary Account Key)
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
                                        🔐 Passkey 2 (Cloud Storage Vault Key)
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
                                disabled={passkeyLoading}
                                onClick={() => {
                                    if (targetScholarshipForDownload) {
                                        executeFormDownload(targetScholarshipForDownload, passkey1, passkey2);
                                    } else {
                                        // Just verify session
                                        executeFormDownload({ id: "verify_session", scholarship_name: "Session Auth" }, passkey1, passkey2);
                                    }
                                }}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                            >
                                {passkeyLoading ? (
                                    <span>Verifying Double Passkey...</span>
                                ) : (
                                    <>
                                        <Key className="w-4 h-4 text-teal-400" />
                                        <span>Verify & Download Form</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PROFILE MATCH ELIGIBILITY RESULT MODAL */}
            <AnimatePresence>
                {eligibilityResultModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 space-y-6 relative"
                        >
                            <button 
                                onClick={() => setEligibilityResultModal(null)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center space-y-2">
                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                                    eligibilityResultModal.isEligible ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                }`}>
                                    {eligibilityResultModal.isEligible ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                                </div>

                                <h3 className="text-xl font-black text-slate-900 font-display">
                                    {eligibilityResultModal.isEligible ? "You Are Eligible!" : "Criteria Check Failed"}
                                </h3>

                                <p className="text-xs font-bold text-slate-500">
                                    {eligibilityResultModal.scholarship_name}
                                </p>
                            </div>

                            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                {eligibilityResultModal.checks.map((chk, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-none">
                                        <div>
                                            <span className="font-bold text-slate-800 block">{chk.label}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{chk.val}</span>
                                        </div>
                                        <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                            chk.pass ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                        }`}>
                                            {chk.pass ? "MATCH ✓" : "NO MATCH ✗"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setEligibilityResultModal(null)}
                                className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl"
                            >
                                Close Result
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
