"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, 
    Send, 
    X, 
    ChevronDown, 
    ChevronUp, 
    Bot, 
    User, 
    Sparkles, 
    Search,
    Book,
    Coffee,
    HelpCircle
} from "lucide-react";

export default function GeneralChatbotPage() {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState([
        { type: "bot", text: "Hello! I'm your College Assistant. I can help you with Fee Deadlines, Scholarship Forms, and Timetable queries. How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages([...messages, { type: "user", text: input }]);
        const userQuery = input.toLowerCase();
        setInput("");

        setTimeout(() => {
            let response = "I'm sorry, I can only handle generic college queries at this stage. Please contact the help desk for specific info.";

            if (userQuery.includes("fee")) {
                response = "The deadline for Semester Fees is Jan 31st, 2026. Late fee charges apply after this date.";
            } else if (userQuery.includes("scholarship")) {
                response = "Scholarship forms are available in the Admin block or can be downloaded from the 'Downloads' section.";
            } else if (userQuery.includes("timetable")) {
                response = "The timetable for the current semester was updated on Jan 15th. Check the official notice board.";
            }

            setMessages(prev => [...prev, { type: "bot", text: response }]);
        }, 800);
    };

    return (
        <main className="min-h-screen bg-white relative">
            {/* Header */}
            <header className="bg-slate-900 text-white p-6 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight">City College</h1>
                    </motion.div>
                    <nav className="hidden md:flex space-x-8 text-sm font-bold uppercase tracking-wider">
                        <a href="#" className="hover:text-primary transition-colors">Home</a>
                        <a href="#" className="hover:text-primary transition-colors">Admissions</a>
                        <a href="#" className="hover:text-primary transition-colors">Departments</a>
                        <a href="#" className="hover:text-primary transition-colors">Contact</a>
                    </nav>
                    <button className="md:hidden">
                        <Search className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight leading-tight">
                        Empowering <span className="text-primary">Minds</span>,<br /> Shaping <span className="text-primary">Futures</span>.
                    </h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto mt-6">
                        Welcome to City College of Engineering. Join our diverse community of learners and innovators dedicated to world-class excellence.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="h-[400px] bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-transparent transition-opacity group-hover:opacity-50" />
                    <Sparkles className="w-20 h-20 opacity-20" />
                    <span className="relative z-10 font-bold uppercase tracking-widest">Main Campus Gallery</span>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
                    <FeatureCard icon={<Book />} title="Academic Excellence" desc="Top-tier curriculum designed for the modern world." delay={0.6} />
                    <FeatureCard icon={<Coffee />} title="Vibrant Life" desc="A campus that never sleeps with 50+ student clubs." delay={0.7} />
                    <FeatureCard icon={<HelpCircle />} title="Always Available" desc="Our digital assistant is here to help 24/7." delay={0.8} />
                </div>
            </section>

            {/* Chatbot Widget */}
            <AnimatePresence>
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="chatbot-widget"
                    style={{ height: isOpen ? 'min(600px, 80vh)' : '68px' }}
                >
                    <div className="chatbot-header" onClick={() => setIsOpen(!isOpen)}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span>College Assist Bot</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </div>

                    {isOpen && (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="chatbot-messages pb-4">
                                {messages.map((msg, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: msg.type === 'bot' ? -10 : 10, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        key={idx} 
                                        className={`message ${msg.type}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {msg.type === 'bot' && <Bot className="w-4 h-4 mt-1 opacity-50 shrink-0" />}
                                            <span>{msg.text}</span>
                                            {msg.type === 'user' && <User className="w-4 h-4 mt-1 opacity-50 shrink-0" />}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <form onSubmit={handleSend} className="chatbot-input">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about fees, dates..."
                                />
                                <button type="submit">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Floating Toggle Button (if widget closed) */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageSquare className="w-8 h-8" />
                </motion.button>
            )}
        </main>
    );
}

function FeatureCard({ icon, title, desc, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="p-8 rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:bg-slate-50 transition-all text-left"
        >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
        </motion.div>
    );
}
