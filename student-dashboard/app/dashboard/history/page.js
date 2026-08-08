"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatHistoryPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [historyItems, setHistoryItems] = useState([
        { id: 1, title: "Tell me about AICTE Pragati Scholarship", time: "Today, 05:32 PM" },
        { id: 2, title: "What are the documents required for merit scholarship?", time: "Today, 04:15 PM" },
        { id: 3, title: "How can I apply for the AICTE Pragati Scholarship?", time: "Today, 03:47 PM" },
        { id: 4, title: "Am I eligible for the AICTE Pragati Scholarship?", time: "Today, 03:20 PM" },
        { id: 5, title: "Explain the fee payment process", time: "Yesterday, 06:10 PM" },
        { id: 6, title: "List of scholarships for girls students", time: "Yesterday, 04:35 PM" },
        { id: 7, title: "Upload certificate not working", time: "Yesterday, 02:18 PM" },
        { id: 8, title: "Placement cell contact details", time: "20 May 2025, 11:40 AM" },
        { id: 9, title: "How to get bonafide certificate?", time: "19 May 2025, 05:22 PM" },
        { id: 10, title: "Academic calendar for this semester", time: "19 May 2025, 03:15 PM" }
    ]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("student_chat_sessions");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.length > 0) {
                        const dynamicItems = parsed.map((s, idx) => ({
                            id: s.id || idx,
                            title: s.title || (s.messages && s.messages[0] ? s.messages[0].text : "Saved Conversation"),
                            time: s.timestamp || "Recently"
                        }));
                        setHistoryItems(dynamicItems);
                    }
                } catch(e) {}
            }
        }
    }, []);

    const handleSelectConversation = (item) => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("pending_chat_query", item.title);
        }
        router.push("/dashboard/chat");
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to clear all chat history?")) {
            setHistoryItems([]);
            if (typeof window !== "undefined") {
                localStorage.removeItem("student_chat_sessions");
            }
        }
    };

    const filteredItems = historyItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* TOOLBAR */}
            <div className="toolbar">
                <div className="search toolbar-search">
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button className="button">
                    ☷ Filter ⌄
                </button>
            </div>

            {/* PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Recent Conversations</div>
                        <div className="panel-subtitle">Your previous conversations with Campus AI</div>
                    </div>

                    <span className="badge">
                        {filteredItems.length} Conversations
                    </span>
                </div>

                {/* CHAT HISTORY LIST */}
                <div style={{ padding: '16px' }}>
                    {filteredItems.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">◷</div>
                            <div className="empty-title">No conversations found</div>
                            <div className="empty-description">
                                {searchQuery ? "Try searching for a different keyword." : "You have no saved chat history. Start a new conversation with Campus AI!"}
                            </div>
                        </div>
                    ) : (
                        <div className="history-list">
                            {filteredItems.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="history-item"
                                    onClick={() => handleSelectConversation(item)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="history-icon">◉</div>

                                    <div className="history-content">
                                        <div className="history-title">{item.title}</div>
                                        <div className="history-time">{item.time}</div>
                                    </div>

                                    <div className="history-arrow">›</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CLEAR HISTORY BUTTON */}
            {historyItems.length > 0 && (
                <div className="disclaimer">
                    <button className="button danger" onClick={handleClearAll}>
                        🗑 Clear all chat history
                    </button>
                </div>
            )}
        </div>
    );
}
