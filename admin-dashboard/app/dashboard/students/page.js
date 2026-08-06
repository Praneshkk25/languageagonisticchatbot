"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, RefreshCw, Save, Activity, Check, Edit2, ShieldAlert, BookOpen, Clock, FileText } from "lucide-react";

export default function StudentDirectory() {
    const [students, setStudents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    
    // Editor Form State
    const [editForm, setEditForm] = useState({
        name: "",
        dob: "",
        cgpa: 0,
        department: "",
        year: 1,
        family_income: 0,
        attendance_pct: 0,
        lectures_attended: 0,
        lectures_total: 40,
        labs_attended: 0,
        labs_total: 15,
        study_hours: 0
    });

    const fetchStudentsAndLogs = async () => {
        setLoading(true);
        try {
            const sRes = await fetch("http://localhost:8000/api/students/all");
            const lRes = await fetch("http://localhost:8000/api/logs/all");
            
            if (sRes.ok) {
                const sData = await sRes.json();
                setStudents(sData);
                if (sData.length > 0 && !selectedStudent) {
                    handleSelectStudent(sData[0]);
                } else if (selectedStudent) {
                    const updated = sData.find(s => s.admission_no === selectedStudent.admission_no);
                    if (updated) handleSelectStudent(updated);
                }
            }
            if (lRes.ok) {
                const lData = await lRes.json();
                setLogs(lData);
            }
        } catch (error) {
            console.error("Failed to load students directory:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentsAndLogs();
    }, []);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setEditForm({
            name: student.name || "",
            dob: student.dob || "",
            cgpa: student.cgpa || 0,
            department: student.department || "",
            year: student.year || 1,
            family_income: student.family_income || 0,
            attendance_pct: student.attendance_pct || 0,
            lectures_attended: student.lectures_attended || 0,
            lectures_total: student.lectures_total || 40,
            labs_attended: student.labs_attended || 0,
            labs_total: student.labs_total || 15,
            study_hours: student.study_hours || 0
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;
        
        try {
            const res = await fetch(`http://localhost:8000/api/students/${selectedStudent.admission_no}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setStatusMsg("Student details updated successfully!");
                setTimeout(() => setStatusMsg(""), 4000);
                fetchStudentsAndLogs();
            } else {
                setStatusMsg("Error updating student details.");
                setTimeout(() => setStatusMsg(""), 4000);
            }
        } catch (error) {
            console.error("Update request error:", error);
            setStatusMsg("Network error during save operation.");
            setTimeout(() => setStatusMsg(""), 4000);
        }
    };

    const filteredStudents = students.filter(s => 
        (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.admission_no || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.department || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const studentLogs = logs.filter(l => l.user_id === selectedStudent?.admission_no);

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Student Directory</h1>
                    <p className="text-muted font-medium text-sm">Manage student profiles, academic metrics, and track individual bot audit trails.</p>
                </div>
                <button onClick={fetchStudentsAndLogs} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    statusMsg.includes("success") ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                }`}>
                    {statusMsg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Student List Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all"
                            placeholder="Search by name, ID, or dept..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col max-h-[600px] overflow-y-auto scrollbar-hide">
                        {loading && students.length === 0 ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                                <p className="text-slate-400 text-xs font-bold uppercase">Loading directory...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm font-semibold italic">No students found.</div>
                        ) : (
                            filteredStudents.map((s) => {
                                const isSelected = selectedStudent?.admission_no === s.admission_no;
                                return (
                                    <div
                                        key={s.admission_no}
                                        onClick={() => handleSelectStudent(s)}
                                        className={`p-4 border-b border-slate-50 cursor-pointer transition-all flex items-center justify-between ${
                                            isSelected ? "bg-slate-100 border-l-4 border-l-primary" : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.admission_no} • {s.department} Year {s.year}</p>
                                        </div>
                                        <span className="text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono">
                                            {s.cgpa} GPA
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Columns: Profile Editor and Logs */}
                <div className="lg:col-span-2 space-y-8">
                    {selectedStudent ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Student Profile Info Form Card */}
                            <div className="card p-6 bg-white border border-slate-100 shadow-xl rounded-3xl flex flex-col justify-between" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                                <form onSubmit={handleSave} className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                            <Edit2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-base" style={{ fontWeight: 800 }}>Profile Editor</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editing: {selectedStudent.admission_no}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Full Name</label>
                                            <input
                                                type="text"
                                                className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date of Birth</label>
                                            <input
                                                type="text"
                                                className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                value={editForm.dob}
                                                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">CGPA</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                value={editForm.cgpa}
                                                onChange={(e) => setEditForm({ ...editForm, cgpa: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Department</label>
                                            <input
                                                type="text"
                                                className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                value={editForm.department}
                                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Academic Year</label>
                                            <input
                                                type="number"
                                                className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                value={editForm.year}
                                                onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Family Income (₹)</label>
                                            <input
                                                type="number"
                                                className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                value={editForm.family_income}
                                                onChange={(e) => setEditForm({ ...editForm, family_income: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 my-4 pt-4">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Attendance & Study Analytics</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Attendance %</label>
                                                <input
                                                    type="number"
                                                    className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                    value={editForm.attendance_pct}
                                                    onChange={(e) => setEditForm({ ...editForm, attendance_pct: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Lectures Attended</label>
                                                <input
                                                    type="number"
                                                    className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                    value={editForm.lectures_attended}
                                                    onChange={(e) => setEditForm({ ...editForm, lectures_attended: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Labs Attended</label>
                                                <input
                                                    type="number"
                                                    className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                    value={editForm.labs_attended}
                                                    onChange={(e) => setEditForm({ ...editForm, labs_attended: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Study Hours</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-primary"
                                                    value={editForm.study_hours}
                                                    onChange={(e) => setEditForm({ ...editForm, study_hours: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full btn-primary h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                                        style={{ background: 'var(--orange-grad)' }}
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </button>
                                </form>
                            </div>

                            {/* Audit Logs Column */}
                            <div className="flex flex-col gap-4">
                                <div className="card p-6 bg-[#1e2025] text-white rounded-3xl border-none shadow-xl flex-1 flex flex-col overflow-hidden max-h-[580px]">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-primary" />
                                            <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-300">Bot Audit Log</h3>
                                        </div>
                                        <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-1 rounded-full">{studentLogs.length} Actions</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3.5 pr-1">
                                        {studentLogs.length === 0 ? (
                                            <p className="text-slate-500 text-xs font-bold text-center py-16 italic">No chatbot interactions recorded for this student yet.</p>
                                        ) : (
                                            studentLogs.map((log) => (
                                                <div key={log.id} className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800 flex flex-col gap-1.5 hover:bg-slate-800/60 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                                                            log.action_type === "CHAT" ? "bg-indigo-500/10 text-indigo-400" :
                                                            log.action_type === "UPLOAD" ? "bg-emerald-500/10 text-emerald-400" :
                                                            "bg-slate-700 text-slate-400"
                                                        }`}>
                                                            {log.action_type}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 font-medium leading-relaxed break-words">{log.details}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/10 flex flex-col items-center justify-center">
                            <Users className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="font-bold text-lg text-slate-600 mb-1">Select a student</h3>
                            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">Choose a student record from the directory sidebar list to manage details and audit logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
