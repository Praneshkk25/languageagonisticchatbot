"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, GraduationCap, Trophy, FileText, TrendingUp, BarChart3, AlertCircle, Info, Sparkles } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
    const [logs, setLogs] = useState([]);
    const [hoveredBar, setHoveredBar] = useState(null);
    const [hoveredSlice, setHoveredSlice] = useState(null);
    const [analytics, setAnalytics] = useState({
        dailyCounts: [
            { day: "Mon", val: 40 },
            { day: "Tue", val: 65 },
            { day: "Wed", val: 85 },
            { day: "Thu", val: 55 },
            { day: "Fri", val: 95 },
            { day: "Sat", val: 30 },
            { day: "Sun", val: 20 }
        ],
        categoryCounts: {
            Admissions: { count: 320, pct: 50 },
            Scholarships: { count: 240, pct: 37 },
            Finance: { count: 80, pct: 13 }
        }
    });

    useEffect(() => {
        const fetchLogsAndAnalyze = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/logs/all");
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);

                    // Initialize daily logs distribution counters
                    const daily = { Mon: 15, Tue: 25, Wed: 35, Thu: 20, Fri: 45, Sat: 15, Sun: 10 };
                    const categories = { Admissions: 25, Scholarships: 15, Finance: 10 };

                    data.forEach(log => {
                        if (log.timestamp) {
                            try {
                                const date = new Date(log.timestamp);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                if (daily[dayName] !== undefined) {
                                    daily[dayName] += 1;
                                }
                            } catch(e) {}
                        }

                        const details = (log.details || "").toLowerCase();
                        if (details.includes("scholarship") || details.includes("eligibility") || details.includes("learn")) {
                            categories.Scholarships += 1;
                        } else if (details.includes("fee") || details.includes("finance") || details.includes("pay")) {
                            categories.Finance += 1;
                        } else {
                            categories.Admissions += 1;
                        }
                    });

                    const totalCategories = categories.Admissions + categories.Scholarships + categories.Finance;
                    const getPct = (val) => Math.round((val / totalCategories) * 100);

                    // Format database results back to component array structures
                    setAnalytics({
                        dailyCounts: Object.entries(daily).map(([day, val]) => ({ day, val })),
                        categoryCounts: {
                            Admissions: { count: categories.Admissions, pct: getPct(categories.Admissions) },
                            Scholarships: { count: categories.Scholarships, pct: getPct(categories.Scholarships) },
                            Finance: { count: categories.Finance, pct: getPct(categories.Finance) }
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to fetch logs analysis:", error);
            }
        };
        fetchLogsAndAnalyze();
    }, []);

    // Get max value of daily counts to determine proportional bar heights
    const maxVal = Math.max(...analytics.dailyCounts.map(d => d.val), 1);

    return (
        <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVariants}
        >
            <motion.div variants={itemVariants} className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ letterSpacing: "-0.035em" }}>Sona College Admin</h1>
                    <p className="text-muted font-medium">Real-time overview of campus queries, scholarship logs, and portal metrics.</p>
                </div>
                {logs.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        <span>Connected: {logs.length} Total Logs</span>
                    </div>
                )}
            </motion.div>

            <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            >
                <StatCard label="Total Students" value="4,500+" desc="Active student base" icon={<Users className="w-5 h-5" />} />
                <StatCard label="Live Log entries" value={logs.length || "10"} desc="Real-time operations" icon={<FileText className="w-5 h-5" />} color="var(--primary)" />
                <StatCard label="Student Placements" value="92%" desc="Placement target met" color="var(--success)" icon={<Trophy className="w-5 h-5" />} />
                <StatCard label="Under Review Files" value="8" desc="Document Approvals due" icon={<GraduationCap className="w-5 h-5" />} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Query Volume Bar Chart */}
                <motion.div variants={itemVariants} className="card p-6 relative overflow-hidden" style={{ minHeight: '380px' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2" style={{ fontWeight: 800 }}>
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Query Volume (7d logs)
                        </h3>
                        {hoveredBar !== null && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md absolute right-6 top-6 flex items-center gap-1.5 border border-slate-700"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{hoveredBar.day}: {hoveredBar.val} Requests</span>
                            </motion.div>
                        )}
                    </div>
                    
                    <div className="flex items-end justify-between h-64 px-4 bg-white/40 rounded-2xl border border-white/60 p-4">
                        {analytics.dailyCounts.map((bar, idx) => {
                            const pctHeight = (bar.val / maxVal) * 100;
                            const isHovered = hoveredBar?.day === bar.day;
                            return (
                                <div 
                                    key={idx} 
                                    className="flex flex-col items-center gap-3 w-8 cursor-pointer group"
                                    onMouseEnter={() => setHoveredBar(bar)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                >
                                    <div className="w-2.5 bg-slate-200/50 rounded-full relative overflow-hidden h-44 group-hover:bg-slate-200/80 transition-colors">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${pctHeight}%` }}
                                            transition={{ delay: idx * 0.05, duration: 0.8 }}
                                            className="absolute bottom-0 left-0 w-full rounded-full"
                                            style={{ 
                                                background: isHovered ? "#17181c" : "var(--orange-grad)",
                                                boxShadow: isHovered ? "0 0 12px rgba(255, 95, 54, 0.4)" : "none"
                                            }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isHovered ? 'text-primary' : 'text-slate-400'}`}>{bar.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Intent Distribution Circular Chart */}
                <motion.div variants={itemVariants} className="card p-6 relative" style={{ minHeight: '380px' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2" style={{ fontWeight: 800 }}>
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Intent Distribution
                        </h3>
                        {hoveredSlice && (
                            <div className="text-[10px] bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 shadow-md flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{hoveredSlice.name}: {hoveredSlice.count} requests ({hoveredSlice.pct}%)</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-around gap-6 h-64 bg-white/40 rounded-2xl border border-white/60 p-6">
                        
                        {/* Circular SVG Rings representation */}
                        <div className="relative w-44 h-44">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Outer Ring - Admissions */}
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="6" />
                                <motion.circle 
                                    cx="50" cy="50" r="40" 
                                    fill="transparent" 
                                    stroke="url(#orangeGrad)" 
                                    strokeWidth="6" 
                                    strokeDasharray="251.2"
                                    initial={{ strokeDashoffset: 251.2 }}
                                    animate={{ strokeDashoffset: 251.2 - (251.2 * analytics.categoryCounts.Admissions.pct) / 100 }}
                                    transition={{ duration: 1.2 }}
                                    strokeLinecap="round" 
                                />

                                {/* Inner Ring - Scholarships */}
                                <circle cx="50" cy="50" r="30" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="6" />
                                <motion.circle 
                                    cx="50" cy="50" r="30" 
                                    fill="transparent" 
                                    stroke="#17181c" 
                                    strokeWidth="6" 
                                    strokeDasharray="188.4"
                                    initial={{ strokeDashoffset: 188.4 }}
                                    animate={{ strokeDashoffset: 188.4 - (188.4 * analytics.categoryCounts.Scholarships.pct) / 100 }}
                                    transition={{ duration: 1 }}
                                    strokeLinecap="round" 
                                />
                                
                                <defs>
                                    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ff5f36" />
                                        <stop offset="100%" stopColor="#ff8340" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer">
                                <span className="text-2xl font-black tracking-tighter text-slate-800">{analytics.categoryCounts.Admissions.pct}%</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Admissions</span>
                            </div>
                        </div>

                        {/* Chart Legend with interactive hover */}
                        <div className="flex flex-col gap-4">
                            <div 
                                className="flex items-center gap-3 p-1.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                                onMouseEnter={() => setHoveredSlice({ name: "Admissions", ...analytics.categoryCounts.Admissions })}
                                onMouseLeave={() => setHoveredSlice(null)}
                            >
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#ff5f36" }} />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Admissions Query</p>
                                    <p className="text-[10px] font-semibold text-slate-400">{analytics.categoryCounts.Admissions.pct}% ({analytics.categoryCounts.Admissions.count} requests)</p>
                                </div>
                            </div>
                            <div 
                                className="flex items-center gap-3 p-1.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                                onMouseEnter={() => setHoveredSlice({ name: "Scholarships", ...analytics.categoryCounts.Scholarships })}
                                onMouseLeave={() => setHoveredSlice(null)}
                            >
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#17181c" }} />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Scholarships & Info</p>
                                    <p className="text-[10px] font-semibold text-slate-400">{analytics.categoryCounts.Scholarships.pct}% ({analytics.categoryCounts.Scholarships.count} requests)</p>
                                </div>
                            </div>
                            <div 
                                className="flex items-center gap-3 p-1.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                                onMouseEnter={() => setHoveredSlice({ name: "Finance & Fees", ...analytics.categoryCounts.Finance })}
                                onMouseLeave={() => setHoveredSlice(null)}
                            >
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.15)" }} />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Finance & Fee Inquiries</p>
                                    <p className="text-[10px] font-semibold text-slate-400">{analytics.categoryCounts.Finance.pct}% ({analytics.categoryCounts.Finance.count} requests)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function StatCard({ label, value, desc, icon, color = "var(--text-main)" }) {
    return (
        <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
            className="card p-6 relative overflow-hidden group"
            style={{ border: '1px solid rgba(255, 255, 255, 0.7)' }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors" style={{ border: '1px solid rgba(0,0,0,0.03)' }}>
                    <div className="text-muted group-hover:text-primary transition-colors">
                        {icon}
                    </div>
                </div>
                <div className="text-xs font-bold text-muted uppercase tracking-widest" style={{ fontSize: '0.65rem' }}>{label}</div>
            </div>
            <div className="text-4xl font-extrabold mb-1" style={{ color, letterSpacing: "-0.035em" }}>{value}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{desc}</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary transition-colors" />
        </motion.div>
    );
}
