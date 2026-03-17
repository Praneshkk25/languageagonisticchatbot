"use client";

import { motion } from "framer-motion";
import { 
    Calendar, 
    Bell, 
    BookOpen, 
    Clock, 
    CreditCard, 
    BarChart, 
    FileText,
    ArrowUpRight
} from "lucide-react";

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

export default function DashboardHome() {
    return (
        <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="w-full space-y-10"
        >
            <motion.div variants={itemVariants} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Welcome back, Student</h1>
                    <p className="text-muted font-medium">Here's your academic overview for today.</p>
                </div>
                <div className="hidden md:flex gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <StatCard
                    label="Pending Fees"
                    value="₹ 0"
                    desc="No dues"
                    icon={<CreditCard className="w-5 h-5" />}
                    color="var(--success)"
                />
                <StatCard
                    label="Attendance"
                    value="85%"
                    desc="+2% from last week"
                    icon={<BarChart className="w-5 h-5" />}
                    color="var(--primary)"
                />
                <StatCard
                    label="Assignments"
                    value="3"
                    desc="Due this week"
                    icon={<FileText className="w-5 h-5" />}
                    color="var(--warning)"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Notices */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            Latest Notices
                        </h2>
                        <button className="text-primary text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        <NoticeCard title="Semester Exam Registration" date="2 hours ago" tag="Exams" color="#ef4444" />
                        <NoticeCard title="Workshop on AI & ML" date="Today, 10:00 AM" tag="Workshop" color="#6366f1" />
                        <NoticeCard title="Library Closed on Sunday" date="Yesterday" tag="Admin" color="#f59e0b" />
                    </div>
                </motion.div>

                {/* Activity Widget */}
                <motion.div variants={itemVariants} className="card p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Recent Activity
                        </h2>
                    </div>
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-slate-300" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Your activity is looking a bit quiet</p>
                            <p className="text-sm text-slate-400 max-w-[200px]">Complete your profile or check assignments to see more.</p>
                        </div>
                        <button className="btn-primary py-2 px-6 rounded-xl text-sm">Get Started</button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function StatCard({ label, value, desc, icon, color }) {
    return (
        <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
            className="card p-6 flex items-start gap-4"
        >
            <div className="p-3 rounded-2xl bg-slate-50" style={{ color: color }}>
                {icon}
            </div>
            <div>
                <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">{label}</div>
                <div className="text-3xl font-extrabold mb-1">{value}</div>
                <div className="text-xs font-medium" style={{ color: color }}>{desc}</div>
            </div>
        </motion.div>
    );
}

function NoticeCard({ title, date, tag, color }) {
    return (
        <motion.div 
            whileHover={{ scale: 1.02 }}
            className="card p-4 flex items-center justify-between group cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="w-2 h-10 rounded-full" style={{ backgroundColor: color }} />
                <div>
                    <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full" 
                               style={{ backgroundColor: `${color}15`, color: color }}>
                            {tag}
                        </span>
                        <span className="text-[10px] text-muted font-bold uppercase">{date}</span>
                    </div>
                    <h3 className="font-bold text-slate-700 leading-tight group-hover:text-primary transition-colors">{title}</h3>
                </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
        </motion.div>
    );
}
