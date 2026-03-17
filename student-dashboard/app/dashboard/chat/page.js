"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Languages, Sparkles, Loader2 } from "lucide-react";

export default function ChatPage() {
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hello! I am your AI Campus Assistant. Ask me anything about fees, exams, or scholarships." }
    ]);
    const [input, setInput] = useState("");
    const [language, setLanguage] = useState("en");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/chat/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage.text, language })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "bot", text: data.response }]);
            } else {
                throw new Error("Server error");
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "Sorry, I am having trouble connecting to the server. Please ensure the backend is running." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col glass rounded-[2rem] overflow-hidden shadow-2xl relative" 
            style={{ height: 'calc(100vh - 12rem)' }}
        >
            {/* Header */}
            <div className="p-6 border-b border-white/20 bg-white/40 flex justify-between items-center backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">Campus AI</h2>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span> 
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 p-1.5 rounded-2xl border border-white/40">
                    <Languages className="w-4 h-4 text-slate-400 ml-2" />
                    <select
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 pr-2 cursor-pointer"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                    </select>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white/50 space-y-8">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={idx} 
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[75%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                                msg.role === "user" 
                                ? "bg-primary text-white rounded-br-none" 
                                : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"
                            }`}>
                                <div className="flex items-start gap-3">
                                    {msg.role === "bot" && <Sparkles className="w-4 h-4 mt-1 opacity-40 shrink-0" />}
                                    <span>{msg.text}</span>
                                    {msg.role === "user" && <User className="w-4 h-4 mt-1 opacity-40 shrink-0" />}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white/50 border border-slate-100 p-4 rounded-2xl rounded-bl-none flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm font-bold text-slate-400">Thinking...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-8 border-t border-white/20 bg-white/50">
                <div className="flex gap-4 relative">
                    <input
                        className="input-field flex-1 h-14 pl-6 pr-16 text-base font-medium shadow-xl bg-white focus:scale-[1.01] transition-transform"
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={loading || !input.trim()} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
