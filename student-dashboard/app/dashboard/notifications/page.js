"use client";

import { useState, useEffect } from "react";

export default function NotificationsPage() {
    const [filter, setFilter] = useState("all");
    const [notifications, setNotifications] = useState([]);
    const [studentId, setStudentId] = useState("2023CS001");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    if (u.id) setStudentId(u.id);
                } catch (e) {}
            }
        }
    }, []);

    const fetchNotifications = async (sid) => {
        const targetId = sid || studentId;
        try {
            const res = await fetch(`http://localhost:8000/api/notifications/student/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data || []);
            }
        } catch (error) {
            console.error("Error fetching student notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications(studentId);

        // Real-time polling every 5 seconds
        const interval = setInterval(() => {
            fetchNotifications(studentId);
        }, 5000);

        return () => clearInterval(interval);
    }, [studentId]);

    const markAllRead = async () => {
        try {
            await fetch(`http://localhost:8000/api/notifications/read-all/${studentId}`, { method: "POST" });
            fetchNotifications(studentId);
        } catch (error) {
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        }
    };

    const clearAll = async () => {
        try {
            await fetch(`http://localhost:8000/api/notifications/clear/${studentId}`, { method: "DELETE" });
            setNotifications([]);
        } catch (error) {
            setNotifications([]);
        }
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        <div className="panel-title">Active Notifications ({studentId})</div>
                        <div className="panel-subtitle">Official campus alerts, document verification results, and announcements</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge warning">🟢 Live Real-Time</span>
                        <span className="badge">{notifications.filter(n => n.unread).length} Unread</span>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredNotifs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">♧</div>
                            <div className="empty-title">No notifications found</div>
                            <div className="empty-description">You are all caught up! When an admin approves or rejects your uploaded document, notifications will appear here in real time.</div>
                        </div>
                    ) : (
                        filteredNotifs.map((n) => (
                            <div key={n.id} className="data-row" style={{ background: n.unread ? 'rgba(91, 53, 232, 0.12)' : '#091329', borderColor: n.unread ? 'var(--primary-2)' : 'var(--border)' }}>
                                <div className="data-icon">{n.icon || "🔔"}</div>
                                <div className="data-content">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="data-title">{n.title}</div>
                                        {n.unread && <span className="badge warning">New</span>}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.desc}</div>
                                    <div className="data-meta" style={{ marginTop: '8px' }}>
                                        <span className="badge">{n.category || "documents"}</span>
                                        <span className="badge">{n.time || "Recently"}</span>
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

