"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, 
    BookOpen, 
    Clock, 
    CreditCard, 
    BarChart, 
    FileText,
    ArrowUpRight,
    TrendingUp,
    MessageSquare,
    Bot,
    Send,
    HelpCircle,
    User,
    Sparkles,
    Mic,
    MicOff,
    Volume2,
    VolumeX
} from "lucide-react";
import { useLanguage } from "../LanguageContext";


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
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0 }
};

export default function DashboardHome() {
    const { t, language } = useLanguage();
    
    // Mini-Chatbot State
    const [miniMessages, setMiniMessages] = useState([
        { role: "user", text: "How are my academic stats looking?" },
        { role: "bot", text: "You are doing great! You completed 3 assignments and attended 2 laboratory sessions this week." }
    ]);
    const [miniInput, setMiniInput] = useState("");
    const [miniLoading, setMiniLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);
    const [miniContext, setMiniContext] = useState(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    return { user_id: u.id };
                } catch(e) {}
            }
        }
        return { user_id: "2023CS001" };
    });
    const chatEndRef = useRef(null);

    const [profile, setProfile] = useState({
        name: "Student",
        admission_no: "2023CS001",
        cgpa: 9.2,
        department: "CSE",
        year: 3,
        attendance_pct: 85,
        lectures_attended: 34,
        lectures_total: 40,
        labs_attended: 10,
        labs_total: 15,
        study_hours: 12.5
    });

    const speak = (text) => {
        if (typeof window === "undefined" || !isTtsEnabled) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = {
            "en": "en-US",
            "hi": "hi-IN",
            "ta": "ta-IN",
            "te": "te-IN"
        };
        utterance.lang = langMap[language] || "en-US";
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const fetchProfile = async () => {
        const studentId = miniContext?.user_id || "2023CS001";
        try {
            const res = await fetch(`http://localhost:8000/api/students/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) {
            console.error("Error fetching student profile:", err);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [miniContext?.user_id]);

    const startSpeechRecognition = () => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Web Speech API is not supported in this browser. Please use Chrome, Edge or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        const langMap = {
            "en": "en-US",
            "hi": "hi-IN",
            "ta": "ta-IN",
            "te": "te-IN"
        };
        recognition.lang = langMap[language] || "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setMiniInput(prev => prev ? prev + " " + transcript : transcript);
        };

        recognition.start();
    };


    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [miniMessages]);

    const handleMiniSend = async () => {
        if (!miniInput.trim()) return;
        const text = miniInput;
        setMiniMessages(prev => [...prev, { role: "user", text }]);
        setMiniInput("");
        setMiniLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/chat/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, language, context: miniContext })
            });
            if (res.ok) {
                const data = await res.json();
                setMiniMessages(prev => [...prev, { role: "bot", text: data.response }]);
                speak(data.response);
                if (data.context) {
                    setMiniContext(data.context);
                }
            } else {
                throw new Error();
            }
        } catch (e) {
            setMiniMessages(prev => [...prev, { role: "bot", text: "I'm having trouble connecting right now. Try checking the portal chat page!" }]);
        } finally {
            setMiniLoading(false);
        }
    };


    return (
        <motion.div 
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="w-full pb-12"
        >
            <div className="flex flex-col gap-6">
                    
                    {/* Header */}
                    <motion.div variants={itemVariants}>
                        <h1 className="text-4xl font-extrabold mb-1 tracking-tight" style={{ letterSpacing: "-0.035em" }}>Let's start strong!</h1>
                        <p className="text-muted font-semibold text-sm">Welcome back, {profile.name}. Here is your overview for today.</p>
                    </motion.div>

                    {/* Weekly Goal Progress Card */}
                    <motion.div 
                        variants={itemVariants} 
                        className="card p-6" 
                        style={{ background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(255, 255, 255, 0.7)' }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">You're {profile.attendance_pct}% to your</p>
                                <p className="text-lg font-bold text-slate-900" style={{ fontWeight: 800 }}>weekly attendance goal</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                <Sparkles className="w-5 h-5 fill-primary" />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-slate-200/50 h-6 rounded-full overflow-hidden p-0.5 border border-white">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${profile.attendance_pct}%` }}
                                    transition={{ duration: 1 }}
                                    className="bg-primary h-full rounded-full"
                                    style={{ background: 'var(--orange-grad)' }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-800">{profile.lectures_attended}/{profile.lectures_total} hrs</span>
                        </div>
                    </motion.div>



                    {/* Summary Header */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between mt-2">
                        <h2 className="text-xl font-bold tracking-tight" style={{ fontWeight: 800 }}>Summary</h2>
                        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                            <span className="px-3 py-1 text-xs font-bold text-muted rounded-lg cursor-pointer">Daily</span>
                            <span className="px-3 py-1 bg-white text-xs font-bold rounded-lg shadow-sm">Weekly</span>
                            <span className="px-3 py-1 text-xs font-bold text-muted rounded-lg cursor-pointer">Monthly</span>
                        </div>
                    </motion.div>

                    {/* Summary Widgets Grid */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Widget 1: Circular Attendance Arcs */}
                        <div className="card p-5 flex flex-col justify-between" style={{ minHeight: '180px', border: '1px solid rgba(255,255,255,0.7)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative w-16 h-16">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#orangeAccent)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * profile.attendance_pct) / 100} strokeLinecap="round" />
                                        <circle cx="50" cy="50" r="28" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />
                                        <circle cx="50" cy="50" r="28" fill="transparent" stroke="#17181c" strokeWidth="8" strokeDasharray="175.8" strokeDashoffset={175.8 - (175.8 * (profile.labs_attended / profile.labs_total * 100)) / 100} strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="orangeAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ff5f36" />
                                                <stop offset="100%" stopColor="#ff8340" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</span>
                                    <h3 className="text-xl font-bold text-slate-800">{profile.attendance_pct}%</h3>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ff5f36" }} />
                                    <span className="text-[10px] font-semibold text-slate-500">Lectures: {profile.lectures_attended}/{profile.lectures_total} hr</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#17181c" }} />
                                    <span className="text-[10px] font-semibold text-slate-500">Lab session: {profile.labs_attended}/{profile.labs_total} hr</span>
                                </div>
                            </div>
                        </div>

                        {/* Widget 2: Weekly Hours Activity */}
                        <div className="card p-5 flex flex-col justify-between" style={{ minHeight: '180px', border: '1px solid rgba(255,255,255,0.7)' }}>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Study Hours</span>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{profile.study_hours} hrs</h3>
                            </div>
                            <div className="flex items-end justify-between h-14 w-full px-1">
                                {[35, 60, 25, 85, 45, 15, 30].map((h, idx) => (
                                    <div key={idx} className="w-1.5 bg-slate-100 rounded-full h-full relative overflow-hidden">
                                        <div 
                                            className="absolute bottom-0 left-0 w-full rounded-full" 
                                            style={{ 
                                                height: `${h}%`, 
                                                background: idx === 3 ? '#17181c' : 'var(--orange-grad)' 
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget 3: GPA Performance splines (Dark Card) */}
                        <div className="card p-5 flex flex-col justify-between" style={{ minHeight: '180px', background: '#2d2f34', border: 'none', color: '#fff' }}>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ color: '#a1a1aa' }}>Performance</span>
                                <h3 className="text-2xl font-black tracking-tight" style={{ fontWeight: 800 }}>{profile.cgpa} CGPA</h3>
                            </div>
                            <div className="h-10 w-full mt-3">
                                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
                                    <path d="M0,32 C20,10 40,30 60,8 C80,25 90,5 100,18" stroke="#ff5f36" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2" style={{ color: '#a1a1aa' }}>Class Rank: 4th</span>
                        </div>
                    </motion.div>

            </div>
        </motion.div>
    );
}


