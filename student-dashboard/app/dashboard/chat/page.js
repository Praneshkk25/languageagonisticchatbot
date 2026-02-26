"use client";

import { useState, useRef, useEffect } from "react";

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

            const data = await res.json();
            setMessages(prev => [...prev, { role: "bot", text: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", text: "Sorry, I am having trouble connecting to the server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col card p-0 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
            <div className="p-4 border-b border-border-color bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <h2 className="font-bold text-sm">Campus AI Assistant</h2>
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                        </span>
                    </div>
                </div>
                <select
                    className="input-field py-1 px-2 text-sm w-auto"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                </select>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                                }`}
                            style={msg.role === 'user' ? { background: 'var(--primary)', color: 'white' } : { background: 'white', border: '1px solid var(--border-color)' }}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm text-xs text-slate-500">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border-color bg-white">
                <div className="flex gap-2">
                    <input
                        className="input-field"
                        placeholder="Type your query..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button onClick={handleSend} disabled={loading} className="btn-primary">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
