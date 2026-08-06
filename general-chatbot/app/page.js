"use client";

import { useState, useRef, useEffect } from "react";
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
    HelpCircle,
    Mic,
    MicOff,
    Languages
} from "lucide-react";

export default function GeneralChatbotPage() {
    const [isOpen, setIsOpen] = useState(true);
    const [language, setLanguage] = useState("en");
    const [messages, setMessages] = useState([
        { type: "bot", text: "Hello! Welcome to Sona College Support. I am your campus guest assistant. I can help answer queries about Admissions, Fees, Timetables, and more. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [chatContext, setChatContext] = useState({ user_id: "GUEST_USER" });
    const messagesEndRef = useRef(null);

    // Initial greeting update when language changes
    useEffect(() => {
        if (messages.length === 1 && messages[0].type === "bot") {
            const greetings = {
                en: "Hello! Welcome to Sona College Support. I am your campus guest assistant. I can help answer queries about Admissions, Fees, Timetables, and more. How can I help you today?",
                hi: "नमस्ते! सोना कॉलेज सहायता केंद्र में आपका स्वागत है। मैं आपका कैंपस गेस्ट असिस्टेंट हूँ। मैं प्रवेश, फीस, समय सारणी और अन्य प्रश्नों के उत्तर देने में आपकी मदद कर सकता हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
                ta: "வணக்கம்! சோனா கல்லூரி ஆதரவு மையத்திற்கு உங்களை வரவேற்கிறோம். நான் உங்கள் வளாக விருந்தினர் உதவியாளர். சேர்க்கை, கட்டணம், கால அட்டவணை போன்ற கேள்விகளுக்கு நான் பதிலளிக்க முடியும். இன்று உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?",
                te: "నమస్కారం! సోనా కాలేజ్ సపోర్ట్‌కు స్వాగతం. నేను మీ క్యాంపస్ గెస్ట్ అసిస్టెంట్. అడ్మిషన్లు, ఫీజులు, టైమ్‌టేబుల్స్ వంటి సందేహాలకు నేను సహాయం చేయగలను. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?"
            };
            setMessages([{ type: "bot", text: greetings[language] || greetings.en }]);
        }
    }, [language]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input;
        setMessages(prev => [...prev, { type: "user", text: userText }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/chat/general", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText, language, context: chatContext })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { type: "bot", text: data.response }]);
                if (data.context) {
                    setChatContext(data.context);
                }
            } else {
                throw new Error();
            }
        } catch (error) {
            setMessages(prev => [...prev, { type: "bot", text: "I'm having difficulty reaching the AI server. Please make sure the backend is active." }]);
        } finally {
            setLoading(false);
        }
    };

    const startSpeechRecognition = () => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
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
            setInput(prev => prev ? prev + " " + transcript : transcript);
        };

        recognition.start();
    };

    // Quick prompts depending on selected language
    const getQuickPrompts = () => {
        const prompts = {
            en: [
                { text: "What are the 14 types of scholarships available for Indian undergraduate students?", label: "🏛️ 14 Scholarship Categories" },
                { text: "What necessary documents are needed for PM-USP Central Sector Scholarship?", label: "📋 Necessary Documents Needed" },
                { text: "What courses does Sona offer?", label: "📚 Course Catalog" },
                { text: "What is the admissions criteria?", label: "🎓 Admissions Rules" }
            ],
            hi: [
                { text: "भारतीय स्नातक छात्रों के लिए 14 प्रकार की छात्रवृत्तियां कौन सी हैं?", label: "🏛️ 14 छात्रवृत्ति श्रेणियां" },
                { text: "छात्रवृत्ति के लिए आवश्यक दस्तावेज क्या हैं?", label: "📋 आवश्यक दस्तावेज" },
                { text: "सोना कौन से कोर्स ऑफर करता है?", label: "📚 पाठ्यक्रम सूची" }
            ],
            ta: [
                { text: "சோனா என்ன படிப்புகளை வழங்குகிறது?", label: "📚 பாடநெறிகள்" },
                { text: "சேர்க்கைக்கான தகுதிகள் என்ன?", label: "🎓 சேர்க்கை விதிகள்" },
                { text: "வளாக தொடர்பு எண்ணை காட்டுங்கள்.", label: "📞 தொடர்பு எண்" }
            ],
            te: [
                { text: "సోనా ఏ కోర్సులు అందిస్తుంది?", label: "📚 కోర్సుల జాబితా" },
                { text: "అడ్మిషన్ అర్హతలు ఏమిటి?", label: "🎓 అడ్మిషన్ల నియమాలు" },
                { text: "సహాయక సిబ్బంది నంబర్లు చూపించు.", label: "📞 సంప్రదించండి" }
            ]
        };
        return prompts[language] || prompts.en;
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
                        <h1 className="text-xl font-extrabold tracking-tight">Sona College</h1>
                    </motion.div>
                    <nav className="hidden md:flex space-x-8 text-sm font-bold uppercase tracking-wider items-center">
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
                        Welcome to Sona College of Engineering. Join our diverse community of learners and innovators dedicated to world-class excellence.
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
                    <span className="relative z-10 font-bold uppercase tracking-widest text-slate-500">Main Campus Gallery</span>
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
                    style={{ height: isOpen ? 'min(620px, 85vh)' : '68px', width: '400px' }}
                >
                    {/* Header */}
                    <div className="chatbot-header" onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span>Sona Assistant</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </div>

                    {isOpen && (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            
                            {/* Multilingual Selector */}
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Language</span>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                                    <Languages className="w-3.5 h-3.5 text-slate-400" />
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="text-[11px] font-bold text-slate-600 bg-transparent border-none outline-none cursor-pointer"
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">हिंदी (Hindi)</option>
                                        <option value="ta">தமிழ் (Tamil)</option>
                                        <option value="te">తెలుగు (Telugu)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Message Area */}
                            <div className="chatbot-messages pb-4 flex-1 overflow-y-auto p-4 space-y-3.5">
                                {messages.map((msg, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: msg.type === 'bot' ? -10 : 10, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        key={idx} 
                                        className={`message ${msg.type}`}
                                    >
                                        <div className="flex items-start gap-2 text-sm leading-relaxed" style={{ fontSize: '0.85rem' }}>
                                            {msg.type === 'bot' && <Bot className="w-4 h-4 mt-1 opacity-50 shrink-0 text-primary" />}
                                            <span style={{ fontWeight: 600 }}>{msg.text}</span>
                                            {msg.type === 'user' && <User className="w-4 h-4 mt-1 opacity-50 shrink-0" />}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="chat-bubble chat-bot flex items-center gap-1.5 bg-slate-100 p-3 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                            <span className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggested Quick Action Prompts */}
                            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                                {getQuickPrompts().map((p, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setInput(p.text)}
                                        className="px-2.5 py-1 bg-slate-50 border border-slate-200/50 hover:bg-primary/5 hover:border-primary/10 text-[10px] font-bold text-slate-500 rounded-full shadow-sm transition-all"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSend} className="chatbot-input flex items-center gap-2 p-3 border-t border-slate-100 bg-white">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Listening..." : "Ask about courses, admissions..."}
                                    className="flex-1 text-xs font-semibold outline-none border-none bg-transparent"
                                />
                                <button 
                                    type="button"
                                    onClick={startSpeechRecognition}
                                    className={`p-2 rounded-xl transition-all ${
                                        isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-slate-100 text-slate-400"
                                    }`}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button type="submit" className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:brightness-105 transition-all">
                                    <Send className="w-3.5 h-3.5" />
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
