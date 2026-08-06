"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Languages, Sparkles, Info, Mic, MicOff, Volume2, VolumeX, Pencil, Square, RotateCcw, Plus, Clock, Trash2, History, X } from "lucide-react";
import { useLanguage } from "../../LanguageContext";

function parseBold(str) {
    if (!str) return "";
    const cleanStr = str.replace(/###/g, "").replace(/^[-•*]\s*/, "");
    const parts = cleanStr.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-black text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}

function FormatMessageText({ text }) {
    if (!text) return null;

    const lines = text.split('\n');

    return (
        <div className="space-y-2.5 text-sm leading-relaxed font-medium">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Header 3 (###)
                if (trimmed.startsWith("###")) {
                    return (
                        <div key={idx} className="text-base font-black text-teal-950 border-b border-teal-200/70 pb-1.5 pt-1 my-1.5 flex items-center gap-2">
                            <span>{parseBold(trimmed)}</span>
                        </div>
                    );
                }

                // Scholarship item header (e.g. 1. **Scholarship Name** or **1. Scholarship Name**)
                if (/^(\d+\.|\*\*|\*)/.test(trimmed) && (trimmed.includes("Scholarship") || trimmed.includes("Scheme") || trimmed.includes("Grant"))) {
                    return (
                        <div key={idx} className="font-black text-sm text-teal-950 bg-teal-50/90 border border-teal-200/80 px-3.5 py-1.5 rounded-xl my-1 shadow-sm">
                            {parseBold(trimmed)}
                        </div>
                    );
                }

                // Sub-bullet points
                if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
                    // Benefits highlight
                    if (trimmed.includes("Benefits") || trimmed.includes("💰")) {
                        return (
                            <div key={idx} className="bg-emerald-50/90 border border-emerald-200/80 p-2.5 rounded-xl my-1 text-xs text-emerald-950 font-bold flex items-start gap-2 shadow-sm">
                                <span>{parseBold(trimmed)}</span>
                            </div>
                        );
                    }

                    // Eligibility highlight
                    if (trimmed.includes("Eligibility") || trimmed.includes("🎓")) {
                        return (
                            <div key={idx} className="bg-slate-100/90 border border-slate-200/80 p-2.5 rounded-xl my-1 text-xs text-slate-800 font-bold flex items-start gap-2 shadow-sm">
                                <span>{parseBold(trimmed)}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold my-1 pl-1">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{parseBold(trimmed)}</span>
                        </div>
                    );
                }

                // Notice/Action Callout Box (📌 Note / Application & Form Download)
                if (trimmed.includes("📌") || trimmed.includes("🔒") || trimmed.includes("🔐")) {
                    return (
                        <div key={idx} className="bg-amber-50/90 border border-amber-200/80 p-3 rounded-2xl text-xs text-amber-950 font-bold my-2 flex items-start gap-2 shadow-sm">
                            <span>{parseBold(trimmed)}</span>
                        </div>
                    );
                }

                // Standard paragraph
                return (
                    <p key={idx} className="text-slate-800 leading-relaxed font-medium">
                        {parseBold(trimmed)}
                    </p>
                );
            })}
        </div>
    );
}

export default function ChatPage() {
    const { language, setLanguage, t } = useLanguage();
    const [messages, setMessages] = useState([
        { role: "bot", text: t('helloAssistant') }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [chatContext, setChatContext] = useState(() => {
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
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Load saved chat sessions from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("student_chat_sessions");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setSessions(parsed);
                    if (parsed.length > 0) {
                        const latest = parsed[0];
                        setCurrentSessionId(latest.id);
                        setMessages(latest.messages);
                        setChatContext(latest.context || { user_id: "2023CS001" });
                    }
                } catch(e) {}
            }
        }
    }, []);

    // Save session to localStorage
    const saveSession = (updatedMessages, updatedCtx) => {
        const msgs = updatedMessages || messages;
        const ctx = updatedCtx || chatContext;
        if (!msgs || msgs.length <= 1) return;

        const firstUserMsg = msgs.find(m => m.role === "user");
        const title = firstUserMsg ? (firstUserMsg.text.length > 32 ? firstUserMsg.text.substring(0, 32) + "..." : firstUserMsg.text) : "Chat Session";
        const sessId = currentSessionId || ("session_" + Date.now());
        if (!currentSessionId) setCurrentSessionId(sessId);

        const updatedSess = {
            id: sessId,
            title: title,
            timestamp: new Date().toISOString(),
            messages: msgs,
            context: ctx
        };

        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== sessId);
            const next = [updatedSess, ...filtered];
            if (typeof window !== "undefined") {
                localStorage.setItem("student_chat_sessions", JSON.stringify(next));
            }
            return next;
        });
    };

    // Start a completely fresh chat (Reset history & memory bleed)
    const handleNewChat = () => {
        const newId = "session_" + Date.now();
        const defaultMsgs = [{ role: "bot", text: t('helloAssistant') }];
        const freshContext = { user_id: chatContext.user_id || "2023CS001", history: [], reset_memory: true };

        setCurrentSessionId(newId);
        setMessages(defaultMsgs);
        setChatContext(freshContext);
        setInput("");
    };

    // Load selected past session
    const loadSession = (sess) => {
        setCurrentSessionId(sess.id);
        setMessages(sess.messages);
        setChatContext(sess.context || { user_id: chatContext.user_id });
        setIsHistoryOpen(false);
    };

    // Delete past session
    const deleteSession = (e, sessId) => {
        e.stopPropagation();
        setSessions(prev => {
            const next = prev.filter(s => s.id !== sessId);
            if (typeof window !== "undefined") {
                localStorage.setItem("student_chat_sessions", JSON.stringify(next));
            }
            return next;
        });
        if (currentSessionId === sessId) {
            handleNewChat();
        }
    };

    const speak = (text) => {
        if (typeof window === "undefined" || !isTtsEnabled) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = {
            "en": "en-US",
            "hi": "hi-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "ne": "ne-NP",
            "ar": "ar-SA",
            "ml": "ml-IN"
        };
        utterance.lang = langMap[language] || "en-US";
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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
            "te": "te-IN",
            "ne": "ne-NP",
            "ar": "ar-SA",
            "ml": "ml-IN"
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
            setInput(prev => prev ? prev + " " + transcript : transcript);
        };

        recognition.start();
    };

    useEffect(() => {
        if (messages.length === 1 && messages[0].role === "bot") {
            setMessages([{ role: "bot", text: t('helloAssistant') }]);
        }
    }, [language, t]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setMessages(prev => [...prev, { role: "bot", text: "⏹️ Response generation stopped by user." }]);
    };

    const handleEditMessage = (index) => {
        const msgToEdit = messages[index];
        if (!msgToEdit || msgToEdit.role !== "user") return;

        setInput(msgToEdit.text);
        setMessages(prev => prev.slice(0, index));
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const res = await fetch("http://localhost:8000/api/chat/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage.text, language, context: chatContext }),
                signal: controller.signal
            });

            if (res.ok) {
                const data = await res.json();
                const updatedMsgs = [...newMessages, { role: "bot", text: data.response }];
                setMessages(updatedMsgs);
                speak(data.response);
                const updatedCtx = data.context || chatContext;
                if (data.context) {
                    setChatContext(data.context);
                }
                saveSession(updatedMsgs, updatedCtx);
            } else {
                throw new Error("Server error");
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                setMessages(prev => [...prev, { role: "bot", text: t('errorConnecting') }]);
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col glass rounded-3xl overflow-hidden shadow-2xl relative border-none flex-1" 
            style={{ 
                border: '1px solid rgba(255, 255, 255, 0.7)',
                background: 'rgba(255, 255, 255, 0.75)'
            }}
        >
            {/* Header */}
            <div className="chat-header">
                <div className="flex items-center gap-4">
                    <div 
                        className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff5f36]/25 transform rotate-3 hover:rotate-0 transition-transform duration-500"
                        style={{ background: 'var(--orange-grad)' }}
                    >
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 tracking-tight" style={{ fontWeight: 800 }}>{t('chatTitle')}</h2>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span> 
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{t('chatStatus')}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2.5 shrink-0">
                    {/* New Chat Button */}
                    <button
                        onClick={handleNewChat}
                        className="h-10 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-teal-600/20 flex items-center gap-2 active:scale-95 transition-all whitespace-nowrap shrink-0"
                    >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>New Chat</span>
                    </button>

                    {/* Chat History Toggle Button */}
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`h-10 px-4 rounded-xl text-xs font-black border transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                            isHistoryOpen 
                            ? "bg-teal-700 text-white border-teal-700 shadow-md" 
                            : "bg-white/90 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border-slate-200 shadow-sm"
                        }`}
                    >
                        <History className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>History ({sessions.length})</span>
                    </button>

                    {/* Read Aloud TTS Toggle Button */}
                    <button
                        onClick={() => {
                            const nextVal = !isTtsEnabled;
                            setIsTtsEnabled(nextVal);
                            if (!nextVal && typeof window !== "undefined") {
                                window.speechSynthesis.cancel();
                            }
                        }}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                            isTtsEnabled
                            ? "bg-teal-50 border-teal-300 text-teal-700 shadow-sm"
                            : "bg-white/90 border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-teal-50 shadow-sm"
                        }`}
                    >
                        {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    
                    {/* Language Selector */}
                    <div className="h-10 flex items-center gap-2 bg-white/90 px-3 rounded-xl border border-slate-200 shadow-sm shrink-0 notranslate">
                        <Languages className="w-4 h-4 text-teal-600 shrink-0" />
                        <select
                            className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 cursor-pointer appearance-none pr-3 relative notranslate"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी (Hindi)</option>
                            <option value="ta">தமிழ் (Tamil)</option>
                            <option value="te">తెలుగు (Telugu)</option>
                            <option value="ne">नेपाली (Nepali)</option>
                            <option value="ar">العربية (Arabic)</option>
                            <option value="ml">മലയാളം (Malayalam)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Slide-out Chat History Panel */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: -300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute left-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl border-r border-teal-200/80 shadow-2xl z-30 flex flex-col p-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-teal-600" />
                                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Past Conversations</h3>
                            </div>
                            <button 
                                onClick={() => setIsHistoryOpen(false)}
                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Session List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                            {sessions.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400">No past conversations yet.</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Start chatting to automatically save your history!</p>
                                </div>
                            ) : (
                                sessions.map((sess) => {
                                    const isActive = sess.id === currentSessionId;
                                    const dateStr = new Date(sess.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div
                                            key={sess.id}
                                            onClick={() => loadSession(sess)}
                                            className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-2 ${
                                                isActive 
                                                ? "bg-teal-50 border-teal-300 shadow-sm" 
                                                : "bg-slate-50/80 hover:bg-white border-slate-200/80 hover:border-teal-200"
                                            }`}
                                        >
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className={`text-xs font-extrabold truncate ${isActive ? "text-teal-950" : "text-slate-800"}`}>
                                                    {sess.title}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                    {dateStr}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => deleteSession(e, sess.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg"
                                                title="Delete chat session"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="pt-3 border-t border-slate-200/80 mt-2">
                            <button
                                onClick={handleNewChat}
                                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Start New Chat</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Messages */}
            <div className="chat-messages-container scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20, y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            key={idx} 
                            className={`group flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className="flex flex-col gap-1.5 max-w-[80%] md:max-w-[70%] relative">
                                <div className={`chat-bubble ${
                                    msg.role === "user" 
                                    ? "chat-user" 
                                    : "chat-bot"
                                }`}>
                                    <div className="flex items-start gap-2.5">
                                        {msg.role === "bot" && (
                                            <div className="shrink-0 mt-1">
                                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                            </div>
                                        )}
                                        {msg.role === "bot" ? (
                                            <div className="flex-1">
                                                <FormatMessageText text={msg.text} />
                                            </div>
                                        ) : (
                                            <span className="font-semibold text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "user" && (
                                        <button 
                                            onClick={() => handleEditMessage(idx)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200/60 rounded-md text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[10px] font-bold"
                                            title="Retrieve & Edit this message"
                                        >
                                            <Pencil className="w-3 h-3 text-teal-600" />
                                            <span>Retrieve & Edit</span>
                                        </button>
                                    )}
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {msg.role === "user" ? 'You' : 'Assistant'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
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
                        <div className="chat-bubble chat-bot flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/30 rounded-full" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{t('thinking')}</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts Bar */}
            <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50/80 shrink-0">
                <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1">Quick Prompts:</span>
                    
                    <button 
                        onClick={() => setInput("What are the 14 types of scholarships available for Indian undergraduate students?")} 
                        className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-extrabold text-slate-700 hover:text-teal-900 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                    >
                        🏛️ 14 Scholarship Categories
                    </button>
                    
                    <button 
                        onClick={() => setInput("What necessary documents are needed for PM-USP Central Sector Scholarship?")} 
                        className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-extrabold text-slate-700 hover:text-teal-900 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                    >
                        📋 Necessary Documents Needed
                    </button>
                    
                    <button 
                        onClick={() => setInput("Am I eligible for the AICTE Pragati Scholarship for Girl Students?")} 
                        className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-extrabold text-slate-700 hover:text-teal-900 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                    >
                        👩‍🎓 AICTE Pragati Eligibility
                    </button>
                    
                    <button 
                        onClick={() => setInput("How do I download scholarship application forms using Double Passkey?")} 
                        className="px-3.5 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-extrabold text-slate-700 hover:text-teal-900 rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                    >
                        🔒 Double Passkey Form Download
                    </button>
                </div>
            </div>

            {/* Input Footer */}
            <div className="chat-footer">
                <div className="max-w-4xl mx-auto flex items-center relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none group-focus-within:text-teal-700 transition-colors z-10">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <input
                        className="chat-input-field w-full h-14 pl-12 pr-32 text-sm font-extrabold placeholder:text-slate-400 bg-white/90 rounded-2xl border-2 border-teal-200/80 focus:border-teal-500 shadow-md text-slate-800"
                        placeholder={isListening ? (language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now') : t('chatPlaceholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                    />
                    {isListening && (
                        <div className="absolute left-12 right-32 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1 bg-white/95 h-11 pointer-events-none z-20 rounded-xl border border-teal-200">
                            <span className="text-xs font-black text-teal-700 mr-2 uppercase tracking-widest animate-pulse">Voice listening...</span>
                            <div className="flex gap-1 items-end h-4">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-teal-600 rounded-full"
                                        animate={{ height: [4, 16, 4] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Right Action Controls Group */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                        {/* Voice Microphone Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startSpeechRecognition}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                isListening 
                                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" 
                                : "bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200"
                            }`}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </motion.button>

                        {/* Send / Stop Response Button */}
                        {loading ? (
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStop} 
                                className="px-3.5 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 text-xs font-black transition-all"
                            >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Stop</span>
                            </motion.button>
                        ) : (
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSend} 
                                disabled={!input.trim()} 
                                className="w-10 h-10 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20 disabled:opacity-40 transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
