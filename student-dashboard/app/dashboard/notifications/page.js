"use client";

import { useState } from "react";

export default function NotificationsPage() {
    const [filter, setFilter] = useState("all");
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Scholarship Portal 2025-26 Open",
            desc: "Applications for Central & State Govt scholarships are now live. Submit before the deadline.",
            time: "10 mins ago",
            category: "scholarships",
            unread: true,
            icon: "🎓"
        },
        {
            id: 2,
            title: "Bonafide Certificate Approved",
            desc: "Your Bonafide Certificate request #DOC-8842 has been verified and signed by Dean.",
            time: "1 hour ago",
            category: "documents",
            unread: true,
            icon: "✓"
        },
        {
            id: 3,
            title: "Upcoming Mid-Semester Exams",
            desc: "The tentative schedule for 5th Sem mid-semester examinations has been published.",
            time: "Yesterday",
            category: "system",
            unread: false,
            icon: "📅"
        },
        {
            id: 4,
            title: "AI Campus Assistant Updated",
            desc: "New scholarship rules & AICTE Pragati guidelines loaded into Campus Chatbot knowledge base.",
            time: "2 days ago",
            category: "system",
            unread: false,
            icon: "📢"
        }
    ]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const filteredNotifs = notifications.filter(n => {
        if (filter === "unread") return n.unread;
        if (filter !== "all") return n.category === filter;
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* TOOLBAR & FILTER */}
            <div className="toolbar">
                <div style={{ display: 'flex', gap: '8px' }}>
                    {["all", "unread", "scholarships", "documents", "system"].map(cat => (
                        <button
                            key={cat}
                            className={`button ${filter === cat ? 'primary' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button className="button" onClick={markAllRead}>✓ Mark All Read</button>
                    <button className="button danger" onClick={clearAll}>🗑 Clear All</button>
                </div>
            </div>

            {/* PANEL */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Active Notifications</div>
                        <div className="panel-subtitle">Stay updated with official campus alerts and announcements</div>
                    </div>
                    <span className="badge">{notifications.filter(n => n.unread).length} Unread</span>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredNotifs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">♧</div>
                            <div className="empty-title">No notifications found</div>
                            <div className="empty-description">You are all caught up! Check back later for new alerts.</div>
                        </div>
                    ) : (
                        filteredNotifs.map((n) => (
                            <div key={n.id} className="data-row" style={{ background: n.unread ? 'rgba(91, 53, 232, 0.12)' : '#091329', borderColor: n.unread ? 'var(--primary-2)' : 'var(--border)' }}>
                                <div className="data-icon">{n.icon}</div>
                                <div className="data-content">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="data-title">{n.title}</div>
                                        {n.unread && <span className="badge warning">New</span>}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.desc}</div>
                                    <div className="data-meta" style={{ marginTop: '8px' }}>
                                        <span className="badge">{n.category}</span>
                                        <span className="badge">{n.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Notifications are sent directly from the Dean's office and Campus AI system.
            </div>
        </div>
    );
}
