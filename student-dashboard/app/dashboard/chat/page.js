"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../LanguageContext";
import { getApiBaseUrl } from "@/lib/api";

function parseFormattedText(str) {
    if (!str) return "";
    const cleanStr = str.replace(/###/g, "").replace(/^[-•*]\s*/, "");
    // Split by Markdown links [title](url) or Bold **text** or raw URLs
    const tokenRegex = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*.*?\*\*|https?:\/\/[^\s)]+)/g;
    const parts = cleanStr.split(tokenRegex);

    return parts.map((part, i) => {
        if (!part) return null;

        // 1. Markdown link [Title](url)
        const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (mdLinkMatch) {
            const title = mdLinkMatch[1];
            const url = mdLinkMatch[2];
            return (
                <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#a78bfa',
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '12px',
                        margin: '2px 4px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span>⚡ {title}</span>
                    <span style={{ fontSize: '10px' }}>↗</span>
                </a>
            );
        }

        // 2. Bold text **text**
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} style={{ fontWeight: 800, color: 'var(--text)' }}>
                    {part.slice(2, -2)}
                </strong>
            );
        }

        // 3. Raw URL https://...
        if (part.startsWith("http://") || part.startsWith("https://")) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        wordBreak: 'break-all'
                    }}
                >
                    {part}
                </a>
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
                        <div key={idx} style={{ fontSize: '14px', fontWeight: 750, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                            <span>{parseFormattedText(trimmed)}</span>
                        </div>
                    );
                }

                return (
                    <p key={idx} style={{ color: 'var(--text)', fontSize: '13.5px', lineHeight: '1.65', margin: 0 }}>
                        {parseFormattedText(trimmed)}
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
            setIsListening(false);
            if (event.error === "aborted" || event.error === "no-speech") {
                return;
            }
            console.warn("Speech recognition notice:", event.error);
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
            const studentId = u.id || u.admission_no || "";
            if (studentId) {
                fetch(`${getApiBaseUrl()}/api/chat/history/save`, {
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
            }
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

        let currentUserId = "";
        try {
            const uStr = localStorage.getItem("user");
            if (uStr) {
                const parsedU = JSON.parse(uStr);
                currentUserId = parsedU.id || parsedU.admission_no || "";
            }
        } catch (e) {}

        try {
            const res = await fetch(`${getApiBaseUrl()}/api/chat/student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: queryText,
                    language: activeLang,
                    context: { user_id: currentUserId }
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
                { label: "5-Stage Tracking Guide", text: "Explain the 5-stage scholarship application lifecycle" }
            ],
            hi: [
                { label: "14 छात्रवृत्ति श्रेणियां", text: "14 छात्रवृत्ति श्रेणियां" },
                { label: "आवश्यक दस्तावेज", text: "छात्रवृत्ति के लिए आवश्यक दस्तावेज क्या हैं?" },
                { label: "एआईसीटीई पात्रता", text: "AICTE छात्रवृत्ति पात्रता बताएं" },
                { label: "5-चरणीय ट्रैकिंग", text: "5-चरणीय छात्रवृत्ति आवेदन ट्रैकिंग कैसे काम करती है?" }
            ],
            ta: [
                { label: "14 உதவித்தொகை வகைகள்", text: "14 உதவித்தொகை வகைகள்" },
                { label: "தேவையான ஆவணங்கள்", text: "தேவையான ஆவணங்கள் எவை?" },
                { label: "AICTE தகுதி", text: "AICTE உதவித்தொகை தகுதி என்ன?" }
            ]
        };
        return prompts[activeLang] || prompts.en;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* CAMPUS AI REUSABLE PANEL */}
            <section className="panel" style={{ boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div className="panel-header" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <div className="panel-title" style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        <div className="panel-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
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
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'var(--primary-soft)', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'var(--primary)', padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}>
                        ⚡ Quick Prompts
                    </span>
                    {getQuickPrompts().map((p, i) => (
                        <button key={i} className="button" onClick={() => handleSend(p.text)} style={{ fontSize: '12px', padding: '6px 12px', minHeight: '34px', height: 'auto', lineHeight: '1.3', textAlign: 'left' }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* CHAT WINDOW */}
                <div className="chat-window" style={{ minHeight: '420px', height: '58vh', maxHeight: '640px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="chat-messages" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`} style={{ position: 'relative' }}>
                                {msg.role === 'bot' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <FormatMessageText text={msg.text} />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                                            <button
                                                onClick={() => speakMessage(msg.text, idx)}
                                                style={{
                                                    background: speakingIdx === idx ? 'var(--primary-soft)' : 'var(--surface-2)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    color: speakingIdx === idx ? 'var(--primary)' : 'var(--text)',
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
                    <div className="chat-input-area" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 14px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                            <textarea
                                className="input"
                                rows="1"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isListening ? "🎙️ Listening..." : (t('chatPlaceholder') || "Ask anything about campus, exams, fees, or scholarships...")}
                                style={{
                                    width: '100%',
                                    minHeight: '48px',
                                    height: '48px',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    fontSize: '13.5px',
                                    lineHeight: '1.4',
                                    background: 'var(--input-bg)',
                                    border: '1.5px solid var(--border)',
                                    color: 'var(--text)',
                                    boxShadow: 'var(--shadow-sm)',
                                    outline: 'none',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        {/* Mic Voice Input Button */}
                        <button
                            type="button"
                            className={`button ${isListening ? 'primary' : ''}`}
                            onClick={startSpeechRecognition}
                            style={{
                                height: '48px',
                                minWidth: '48px',
                                width: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0',
                                background: isListening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--primary-soft)',
                                border: isListening ? '1px solid #f87171' : '1.5px solid var(--border)',
                                color: isListening ? '#ffffff' : 'var(--primary)',
                                boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'var(--shadow-sm)',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }}
                            title="Speak in your selected language (Voice Input)"
                        >
                            <span style={{ fontSize: '20px' }}>🎙️</span>
                        </button>

                        <button 
                            className="button primary" 
                            onClick={() => handleSend()} 
                            disabled={!input.trim() || loading} 
                            style={{ 
                                height: '48px', 
                                padding: '0 16px', 
                                borderRadius: '12px', 
                                fontSize: '14px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexShrink: 0
                            }}
                        >
                            <span>Send</span>
                            <span style={{ fontSize: '15px' }}>🚀</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* SUGGESTED TOPICS GRID */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>
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
