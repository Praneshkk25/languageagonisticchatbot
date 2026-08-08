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

export default function ChatPage() {
    const { language } = useLanguage();
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hello! I am your AI Campus Assistant. Ask me anything about fees, exams, or scholarships." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (textToSend) => {
        const queryText = textToSend || input;
        if (!queryText.trim() || loading) return;

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
                    language: language || "en",
                    context: { user_id: "2023CS001" }
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...newMessages, { role: "bot", text: data.response }]);
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
        setMessages([{ role: "bot", text: "Hello! I am your AI Campus Assistant. Ask me anything about fees, exams, or scholarships." }]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* CAMPUS AI REUSABLE PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Campus AI</div>
                        <div className="panel-subtitle">Ask anything about college, admissions, events, or policies.</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="button primary" onClick={handleNewChat}>
                            + New Chat
                        </button>
                        <button className="button">
                            ◷ History (1)
                        </button>
                    </div>
                </div>

                {/* EXAMPLE PROMPTS ROW */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span className="badge">Quick Prompt</span>
                    <button className="button" onClick={() => handleSend("14 Scholarship Categories")}>14 Scholarship Categories</button>
                    <button className="button" onClick={() => handleSend("Necessary Documents Needed")}>Necessary Documents Needed</button>
                    <button className="button" onClick={() => handleSend("AICTE Prajval Eligibility")}>AICTE Prajval Eligibility</button>
                    <button className="button" onClick={() => handleSend("Double Passkey Form Download")}>Double Passkey Form Download</button>
                </div>

                {/* CHAT WINDOW */}
                <div className="chat-window">
                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                {msg.role === 'bot' ? (
                                    <FormatMessageText text={msg.text} />
                                ) : (
                                    <span>{msg.text}</span>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="message ai">
                                <span>Generating response...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* CHAT INPUT AREA */}
                    <div className="chat-input-area">
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
                            placeholder="Type your question here..."
                        />
                        <button className="button primary" onClick={() => handleSend()} disabled={!input.trim() || loading}>
                            Send 🚀
                        </button>
                    </div>
                </div>
            </section>

            {/* SUGGESTED TOPICS GRID */}
            <div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Suggested Topics</div>
                <div className="grid grid-4">
                    <div className="feature-card" onClick={() => handleSend("Tell me about scholarships")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">🎓</div>
                        <div className="feature-title">Scholarships</div>
                        <div className="feature-description">Find and apply for scholarships</div>
                    </div>

                    <div className="feature-card" onClick={() => handleSend("Where can I find exam schedules?")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">📄</div>
                        <div className="feature-title">Exam Information</div>
                        <div className="feature-description">Schedules, results and updates</div>
                    </div>

                    <div className="feature-card" onClick={() => handleSend("What is the fee structure?")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">💳</div>
                        <div className="feature-title">Fee Details</div>
                        <div className="feature-description">Fee structure and payment info</div>
                    </div>

                    <div className="feature-card" onClick={() => handleSend("What are upcoming college events?")} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">📅</div>
                        <div className="feature-title">College Events</div>
                        <div className="feature-description">Upcoming events and activities</div>
                    </div>
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Campus AI may make mistakes. Please verify important information.
            </div>
        </div>
    );
}
