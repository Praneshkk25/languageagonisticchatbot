"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../LanguageContext";

function parseBold(str) {
    if (!str) return "";
    const cleanStr = str.replace(/###/g, "").replace(/^[-•*]\s*/, "");
    const parts = cleanStr.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} style={{ fontWeight: 800, color: '#ffffff' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith("###")) {
                    return (
                        <div key={idx} style={{ fontSize: '14px', fontWeight: 700, color: '#bcaaff', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                            <span>{parseBold(trimmed)}</span>
                        </div>
                    );
                }

                return (
                    <p key={idx} style={{ color: '#d9deec', fontSize: '13px', lineHeight: '1.6' }}>
                        {parseBold(trimmed)}
                    </p>
                );
            })}
        </div>
    );
}

const langTagMap = {
    en: "en-US",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    ml: "ml-IN",
    ar: "ar-SA",
    ne: "ne-NP"
};

const initialGreetings = {
    en: "Hello! I am your AI Campus Assistant. Ask me anything about fees, exams, or scholarships.",
    hi: "नमस्ते! मैं आपका एआई कैंपस सहायक हूँ। मुझसे फीस, परीक्षा या छात्रवृत्ति के बारे में कुछ भी पूछें।",
    ta: "வணக்கம்! நான் உங்கள் AI கேம்பஸ் உதவியாளர். கட்டணம், தேர்வுகள் அல்லது உதவித்தொகை பற்றி எதையும் கேளுங்கள்.",
    te: "హలో! నేను మీ AI క్యాంపస్ అసిస్టెంట్‌ని. ఫీజులు, పరీక్షలు లేదా స్కాలర్‌షిప్‌ల గురించి ఏదైనా అడగండి.",
    ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI ക്യാമ്പസ് അസിസ്റ്റന്റാണ്. ഫീസ്, പരീക്ഷകൾ, സ്കോളർഷിപ്പുകൾ എന്നിവയെക്കുറിച്ച് എന്തും ചോദിക്കൂ.",
    ar: "مرحباً! أنا مساعد الحرم الجامعي بالذكاء الاصطناعي. اسألني عن الرسوم أو الامتحانات أو المنح الدراسية.",
    ne: "नमस्ते! म तपाईंको एआई क्याम्पस सहायक हुँ। शुल्क, परीक्षा वा छात्रवृत्तिको बारेमा मलाई केही पनि सोध्नुहोस्।"
};

export default function ChatPage() {
    const { language, t } = useLanguage();
    const activeLang = language || "en";

    const [messages, setMessages] = useState([
        { role: "bot", text: initialGreetings[activeLang] || initialGreetings.en }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [speakingIdx, setSpeakingIdx] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const messagesEndRef = useRef(null);

    // Restore pending session from sessionStorage (if clicked from Chat History page) or create new sessionId
    useEffect(() => {
        if (typeof window !== "undefined") {
            const pending = sessionStorage.getItem("pending_chat_session");
            const pendingQuery = sessionStorage.getItem("pending_chat_query");

            if (pending) {
                try {
                    const parsed = JSON.parse(pending);
                    if (parsed && parsed.messages && parsed.messages.length > 0) {
                        setMessages(parsed.messages);
                        setSessionId(parsed.session_id || parsed.id || `session_${Date.now()}`);
                        sessionStorage.removeItem("pending_chat_session");
                        return;
                    }
                } catch (e) {}
            }

            const newId = `session_${Date.now()}`;
            setSessionId(newId);

            if (pendingQuery) {
                sessionStorage.removeItem("pending_chat_query");
                setTimeout(() => handleSend(pendingQuery), 300);
            }
        }
    }, []);

    // Speech Recognition (Voice Input / STT)
    const startSpeechRecognition = () => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = langTagMap[activeLang] || "en-US";
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

    // Speech Synthesis (Voice Answering / TTS)
    const speakMessage = (text, idx) => {
        if (typeof window === "undefined" || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        if (speakingIdx === idx) {
            setSpeakingIdx(null);
            return;
        }

        const cleanText = text.replace(/[\*\#\`\-\_]/g, ' ').replace(/\s+/g, ' ').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const targetLang = langTagMap[activeLang] || "en-US";
        utterance.lang = targetLang;

        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        utterance.onend = () => setSpeakingIdx(null);
        utterance.onerror = () => setSpeakingIdx(null);

        setSpeakingIdx(idx);
        window.speechSynthesis.speak(utterance);
    };

    // Helper to auto-save current session thread to localStorage and backend
    const saveSession = (updatedMsgs, activeSessId) => {
        if (typeof window === "undefined" || !updatedMsgs || updatedMsgs.length < 2) return;
        const curId = activeSessId || sessionId || `session_${Date.now()}`;
        const firstUserMsg = updatedMsgs.find(m => m.role === "user");
        const title = firstUserMsg ? (firstUserMsg.text.length > 50 ? firstUserMsg.text.substring(0, 50) + "..." : firstUserMsg.text) : "Campus AI Chat";
        const dateStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

        const sessionObj = {
            session_id: curId,
            id: curId,
            title: title,
            timestamp: dateStr,
            messages: updatedMsgs
        };

        // 1. LocalStorage
        try {
            const storedStr = localStorage.getItem("student_chat_sessions");
            let list = storedStr ? JSON.parse(storedStr) : [];
            const idx = list.findIndex(s => (s.session_id === curId || s.id === curId));
            if (idx >= 0) {
                list[idx] = sessionObj;
            } else {
                list.unshift(sessionObj);
            }
            localStorage.setItem("student_chat_sessions", JSON.stringify(list));
        } catch (e) {}

        // 2. Backend API
        try {
            const userStr = localStorage.getItem("user");
            const u = userStr ? JSON.parse(userStr) : {};
            const studentId = u.id || "2023CS001";
            fetch("http://localhost:8000/api/chat/history/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: curId,
                    student_id: studentId,
                    title: title,
                    timestamp: dateStr,
                    messages: updatedMsgs
                })
            }).catch(() => {});
        } catch (e) {}
    };

    const handleSend = async (textToSend) => {
        const queryText = textToSend || input;
        if (!queryText.trim() || loading) return;

        const currentActiveSessionId = sessionId || `session_${Date.now()}`;
        if (!sessionId) setSessionId(currentActiveSessionId);

        const newMessages = [...messages, { role: "user", text: queryText }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/chat/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: queryText,
                    language: activeLang,
                    context: { user_id: "2023CS001" }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newBotMsgIndex = newMessages.length;
                const finalMessages = [...newMessages, { role: "bot", text: data.response }];
                setMessages(finalMessages);
                saveSession(finalMessages, currentActiveSessionId);

                if (autoSpeak) {
                    setTimeout(() => speakMessage(data.response, newBotMsgIndex), 200);
                }
            } else {
                throw new Error();
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: "bot", text: "I'm having trouble connecting to the campus server right now. Please try again shortly!" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("pending_chat_session");
            sessionStorage.removeItem("pending_chat_query");
        }
        const freshId = `session_${Date.now()}`;
        setSessionId(freshId);
        setSpeakingIdx(null);
        setMessages([{ role: "bot", text: initialGreetings[activeLang] || initialGreetings.en }]);
    };

    const getQuickPrompts = () => {
        const prompts = {
            en: [
                { label: "14 Scholarship Categories", text: "14 Scholarship Categories" },
                { label: "Necessary Documents Needed", text: "Necessary Documents Needed" },
                { label: "AICTE Prajval Eligibility", text: "AICTE Prajval Eligibility" },
                { label: "Double Passkey Form Download", text: "Double Passkey Form Download" }
            ],
            hi: [
                { label: "14 छात्रवृत्ति श्रेणियां", text: "14 छात्रवृत्ति श्रेणियां" },
                { label: "आवश्यक दस्तावेज", text: "छात्रवृत्ति के लिए आवश्यक दस्तावेज क्या हैं?" },
                { label: "एआईसीटीई पात्रता", text: "AICTE छात्रवृत्ति पात्रता बताएं" },
                { label: "फॉर्म डाउनलोड", text: "छात्रवृत्ति फॉर्म कैसे डाउनलोड करें?" }
            ],
            ta: [
                { label: "14 உதவித்தொகை வகைகள்", text: "14 உதவித்தொகை வகைகள்" },
                { label: "தேவையான ஆவணங்கள்", text: "தேவையான ஆவணங்கள் எவை?" },
                { label: "AICTE தகுதி", text: "AICTE உதவித்தொகை தகுதி என்ன?" }
            ],
            te: [
                { label: "14 స్కాలర్‌షిప్ వర్గాలు", text: "14 స్కాలర్‌షిప్ వర్గాలు" },
                { label: "అవసరమైన పత్రాలు", text: "అవసరమైన పత్రాలు ఏమిటి?" },
                { label: "AICTE అర్హత", text: "AICTE స్కాలర్‌షిప్ అర్హతలు" }
            ],
            ml: [
                { label: "14 സ്കോളർഷിപ്പ് വിഭാഗങ്ങൾ", text: "14 സ്കോളർഷിപ്പ് വിഭാഗങ്ങൾ" },
                { label: "ആവശ്യമായ രേഖകൾ", text: "ആവശ്യമായ രേഖകൾ എതെല്ലാം?" },
                { label: "AICTE യോഗ്യത", text: "AICTE സ്കോളർഷിപ്പ് യോഗ്യത എന്ത്?" }
            ],
            ar: [
                { label: "14 فئات من المنح", text: "14 فئات من المنح الدراسية" },
                { label: "المستندات المطلوبة", text: "ما هي المستندات المطلوبة؟" },
                { label: "أهلية AICTE", text: "ما هي شروط المنحة؟" }
            ],
            ne: [
                { label: "१४ छात्रवृत्ति श्रेणीहरू", text: "१४ छात्रवृत्ति श्रेणीहरू" },
                { label: "आवश्यक कागजातहरू", text: "आवश्यक कागजातहरू के के हुन्?" },
                { label: "AICTE योग्यता", text: "AICTE छात्रवृत्ति योग्यता के हो?" }
            ]
        };
        return prompts[activeLang] || prompts.en;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* CAMPUS AI REUSABLE PANEL */}
            <section className="panel" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
                <div className="panel-header" style={{ background: 'linear-gradient(180deg, rgba(20, 32, 64, 0.8), rgba(12, 22, 45, 0.9))' }}>
                    <div>
                        <div className="panel-title" style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '10px', 
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '16px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                            }}>🤖</span>
                            {t('chatTitle') || 'Campus AI'}
                        </div>
                        <div className="panel-subtitle" style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                            Ask anything about college, admissions, exams, fees, or scholarships.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Auto Speak Toggle */}
                        <button 
                            className={`button ${autoSpeak ? 'primary' : ''}`}
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            title="Toggle automatic voice answering for new responses"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '38px', height: 'auto', padding: '6px 14px', lineHeight: '1.3' }}
                        >
                            <span>{autoSpeak ? '🔊 Auto-Speak ON' : '🔇 Auto-Speak OFF'}</span>
                        </button>
                        <button className="button primary" onClick={handleNewChat} style={{ minHeight: '38px', height: 'auto', padding: '6px 16px', lineHeight: '1.3' }}>
                            + New Chat
                        </button>
                    </div>
                </div>

                {/* EXAMPLE PROMPTS ROW */}
                <div style={{ padding: '14px 24px', borderBottom: '1.5px solid rgba(139, 92, 246, 0.2)', background: 'rgba(10, 18, 38, 0.6)', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(217, 70, 239, 0.2))', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#e9d5ff', padding: '6px 12px', fontSize: '11px', fontWeight: 700 }}>
                        ⚡ Quick Prompts
                    </span>
                    {getQuickPrompts().map((p, i) => (
                        <button key={i} className="button" onClick={() => handleSend(p.text)} style={{ fontSize: '12px', padding: '6px 14px', minHeight: '36px', height: 'auto', lineHeight: '1.3', textAlign: 'left' }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* CHAT WINDOW */}
                <div className="chat-window" style={{ height: '580px', maxHeight: '580px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="chat-messages" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`} style={{ position: 'relative' }}>
                                {msg.role === 'bot' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <FormatMessageText text={msg.text} />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                                            <button
                                                onClick={() => speakMessage(msg.text, idx)}
                                                style={{
                                                    background: speakingIdx === idx ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                                    borderRadius: '8px',
                                                    color: speakingIdx === idx ? '#e9d5ff' : '#cbd5e1',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    padding: '4px 10px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title="Listen to response (Voice Answering)"
                                            >
                                                <span>{speakingIdx === idx ? '🔊 Stop' : '🔊 Listen'}</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <span>{msg.text}</span>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="message ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ display: 'inline-block' }}>⏳</span>
                                <span>{t('thinking') || 'Thinking and generating response...'}</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* CHAT INPUT AREA */}
                    <div className="chat-input-area" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <textarea
                                className="input"
                                rows="2"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isListening ? "🎙️ Listening... Speak your question now!" : (t('chatPlaceholder') || "Ask anything about campus, exams, fees, or scholarships...")}
                                style={{
                                    width: '100%',
                                    minHeight: '64px',
                                    padding: '14px 18px',
                                    borderRadius: '14px',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    background: 'rgba(11, 20, 42, 0.95)',
                                    border: '1.5px solid rgba(139, 92, 246, 0.4)',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Mic Voice Input Button */}
                        <button
                            type="button"
                            className={`button ${isListening ? 'primary' : ''}`}
                            onClick={startSpeechRecognition}
                            style={{
                                height: '64px',
                                width: '70px',
                                borderRadius: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: '0',
                                background: isListening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(99, 102, 241, 0.15)',
                                border: isListening ? '1px solid #f87171' : '1.5px solid rgba(139, 92, 246, 0.4)',
                                color: isListening ? '#ffffff' : '#c7d2fe',
                                boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 4px 14px rgba(0, 0, 0, 0.2)',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }}
                            title="Speak in your selected language (Voice Input)"
                        >
                            <span style={{ fontSize: '18px' }}>🎙️</span>
                            <span style={{ fontSize: '11px', fontWeight: 700 }}>{isListening ? 'Listening' : 'Mic'}</span>
                        </button>

                        <button 
                            className="button primary" 
                            onClick={() => handleSend()} 
                            disabled={!input.trim() || loading} 
                            style={{ 
                                height: '64px', 
                                padding: '0 24px', 
                                borderRadius: '14px',
                                fontSize: '15px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexShrink: 0
                            }}
                        >
                            <span>Send</span>
                            <span style={{ fontSize: '18px' }}>🚀</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* SUGGESTED TOPICS GRID */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px' }}>💡</span>
                    <span>Suggested Topics</span>
                </div>
                <div className="grid grid-4">
                    <div className="feature-card" onClick={() => handleSend("Tell me about scholarships")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">🎓</div>
                        <div className="feature-title">{t('scholarships') || 'Scholarships'}</div>
                        <div className="feature-description">Find and apply for 14+ scholarship categories</div>
                    </div>

                    <div className="feature-card" onClick={() => handleSend("Where can I find exam schedules?")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">📄</div>
                        <div className="feature-title">Exam Information</div>
                        <div className="feature-description">Schedules, seating plans, results and hall tickets</div>
                    </div>

                    <div className="feature-card" onClick={() => handleSend("What is the fee structure?")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">💳</div>
                        <div className="feature-title">Fee Details</div>
                        <div className="feature-description">Tuition, hostel fees, and online payment options</div>
                    </div>

                    <div className="feature-card" onClick={() => handleSend("What are upcoming college events?")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">📅</div>
                        <div className="feature-title">College Events</div>
                        <div className="feature-description">Upcoming symposiums, fests, and workshops</div>
                    </div>
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="disclaimer" style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
                🛡️ Campus AI may make mistakes. Please verify official academic announcements on the campus portal.
            </div>
        </div>
    );
}
