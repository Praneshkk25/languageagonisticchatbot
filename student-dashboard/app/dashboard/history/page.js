"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatHistoryPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadChatHistory = async () => {
        setLoading(true);
        let sessions = [];

        // 1. Read from localStorage cache
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("student_chat_sessions");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        sessions = parsed;
                    }
                } catch (e) {}
            }
        }

        // 2. Read from Backend API
        try {
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            const u = userStr ? JSON.parse(userStr) : {};
            const studentId = u.id || "2023CS001";

            const res = await fetch(`http://localhost:8000/api/chat/history/${studentId}`);
            if (res.ok) {
                const apiSessions = await res.json();
                if (Array.isArray(apiSessions) && apiSessions.length > 0) {
                    // Merge and deduplicate sessions by session_id / id
                    const sessionMap = new Map();
                    [...sessions, ...apiSessions].forEach(s => {
                        const sid = s.session_id || s.id;
                        if (sid && !sessionMap.has(sid)) {
                            sessionMap.set(sid, {
                                session_id: sid,
                                id: sid,
                                title: s.title || (s.messages && s.messages[0] ? s.messages[0].text : "Saved Conversation"),
                                timestamp: s.timestamp || "Recently",
                                messages: s.messages || []
                            });
                        }
                    });
                    sessions = Array.from(sessionMap.values());
                    // Sync merged list back to localStorage
                    if (typeof window !== "undefined") {
                        localStorage.setItem("student_chat_sessions", JSON.stringify(sessions));
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching chat history from backend:", e);
        }

        setHistoryItems(sessions);
        setLoading(false);
    };

    useEffect(() => {
        loadChatHistory();
    }, []);

    const handleSelectConversation = (item) => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("pending_chat_session", JSON.stringify(item));
        }
        router.push("/dashboard/chat");
    };

    const handleDeleteSingle = async (e, session_id) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        const updated = historyItems.filter(s => (s.session_id !== session_id && s.id !== session_id));
        setHistoryItems(updated);

        if (typeof window !== "undefined") {
            localStorage.setItem("student_chat_sessions", JSON.stringify(updated));
        }

        try {
            await fetch(`http://localhost:8000/api/chat/history/session/${session_id}`, { method: "DELETE" });
        } catch (err) {}
    };

    const handleClearAll = async () => {
        if (confirm("Are you sure you want to clear ALL saved chat history?")) {
            setHistoryItems([]);
            if (typeof window !== "undefined") {
                localStorage.removeItem("student_chat_sessions");
                const userStr = localStorage.getItem("user");
                const u = userStr ? JSON.parse(userStr) : {};
                const studentId = u.id || "2023CS001";
                try {
                    await fetch(`http://localhost:8000/api/chat/history/clear/${studentId}`, { method: "DELETE" });
                } catch (err) {}
            }
        }
    };

    const filteredItems = historyItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* TOOLBAR */}
            <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="search toolbar-search" style={{ flex: 1, maxWidth: '400px' }}>
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search past conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button" onClick={loadChatHistory}>
                        ↻ Refresh
                    </button>
                    {historyItems.length > 0 && (
                        <button className="button danger" onClick={handleClearAll}>
                            🗑 Clear All History
                        </button>
                    )}
                </div>
            </div>

            {/* PANEL */}
            <section className="panel" style={{ background: '#0a142b', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="panel-header" style={{ padding: '20px 24px', background: 'rgba(15, 25, 52, 0.8)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="panel-title" style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Saved Chat Conversations</div>
                        <div className="panel-subtitle" style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Click any conversation thread to view or continue asking queries</div>
                    </div>

                    <span className="badge" style={{ background: 'var(--primary-soft)', color: '#ffffff', padding: '6px 14px', fontSize: '12px' }}>
                        {filteredItems.length} Real Saved Sessions
                    </span>
                </div>

                {/* CHAT HISTORY LIST */}
                <div style={{ padding: '20px' }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                            ⏳ Loading saved conversations...
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div className="empty-icon" style={{ fontSize: '36px', marginBottom: '12px' }}>◷</div>
                            <div className="empty-title" style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>No conversations found</div>
                            <div className="empty-description" style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                                {searchQuery ? "No matching conversations found for your search term." : "You have no saved chat history. Start a new conversation with Campus AI!"}
                            </div>
                        </div>
                    ) : (
                        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredItems.map((item) => (
                                <div 
                                    key={item.session_id || item.id} 
                                    className="history-item"
                                    onClick={() => handleSelectConversation(item)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        padding: '16px 20px', 
                                        background: '#081229', 
                                        border: '1px solid var(--border)', 
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                            💬
                                        </div>

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.title}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span>🕒 {item.timestamp}</span>
                                                <span>•</span>
                                                <span>{(item.messages || []).length} Messages</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '16px' }}>
                                        <button 
                                            type="button" 
                                            className="button danger" 
                                            onClick={(e) => handleDeleteSingle(e, item.session_id || item.id)}
                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                            title="Delete conversation"
                                        >
                                            🗑 Delete
                                        </button>
                                        <span style={{ fontSize: '18px', color: '#94a3b8' }}>›</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
