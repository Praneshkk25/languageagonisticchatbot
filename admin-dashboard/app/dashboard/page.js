"use client";

import { motion } from "framer-motion";
import { Users, GraduationCap, Trophy, FileText, TrendingUp, BarChart3 } from "lucide-react";

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
    return (
        <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVariants}
        >
            <motion.div variants={itemVariants} className="mb-10">
                <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Sona College Admin</h1>
                <p className="text-muted font-medium">Overview of Sona Campus Departments & Student Activities.</p>
            </motion.div>

            <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            >
                <StatCard label="Total Students" value="4,500+" desc="Across all depts" icon={<Users className="w-5 h-5" />} />
                <StatCard label="Admissions (2026)" value="850" desc="Applications received" icon={<GraduationCap className="w-5 h-5" />} />
                <StatCard label="Placements" value="92%" desc="Placement Rate" color="var(--success)" icon={<Trophy className="w-5 h-5" />} />
                <StatCard label="Research Papers" value="120+" desc="Published this year" color="var(--primary)" icon={<FileText className="w-5 h-5" />} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="card p-6" style={{ minHeight: '350px' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Query Volume (7d)
                        </h3>
                    </div>
                    <div className="flex items-center justify-center h-64 text-muted bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        [Animated Chart Area]
                    </div>
                </motion.div>
                <motion.div variants={itemVariants} className="card p-6" style={{ minHeight: '350px' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Intent Distribution
                        </h3>
                    </div>
                    <div className="flex items-center justify-center h-64 text-muted bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        [Animated Chart Area]
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
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors">
                    <div className="text-muted group-hover:text-primary transition-colors">
                        {icon}
                    </div>
                </div>
                <div className="text-xs font-bold text-muted uppercase tracking-widest">{label}</div>
            </div>
            <div className="text-4xl font-extrabold mb-1" style={{ color }}>{value}</div>
            <div className="text-sm text-muted font-medium">{desc}</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/10 group-hover:bg-primary transition-colors" />
        </motion.div>
    );
}
