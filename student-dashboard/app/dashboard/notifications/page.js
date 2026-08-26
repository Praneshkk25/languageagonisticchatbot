"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";

export default function NotificationsPage() {
    const router = useRouter();
    const [filter, setFilter] = useState("all"); // "all", "scholarships", "documents", "applications", "unread"
    const [notifications, setNotifications] = useState([]);
    const [studentId, setStudentId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    const sid = u.id || u.admission_no || "";
                    if (sid) {
                        setStudentId(sid);
                        fetchNotifications(sid);
                    }
                } catch (e) {}
            }
        }
    }, []);

    const fetchNotifications = async (sid) => {
        const targetId = sid || studentId || "23CSEBE274";
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/notifications/student/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data || []);
            }
        } catch (error) {
            console.error("Error fetching student notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) fetchNotifications(studentId);

        const handleVisibility = () => {
            if (!document.hidden && studentId) fetchNotifications(studentId);
        };

        const interval = setInterval(() => {
            if (!document.hidden && studentId) fetchNotifications(studentId);
        }, 12000);

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [studentId]);

    const markAllRead = async () => {
        const targetId = studentId || "23CSEBE274";
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        try {
            await fetch(`${getApiBaseUrl()}/api/notifications/read-all/${targetId}`, { method: "POST" });
            fetchNotifications(targetId);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("notificationsUpdated"));
            }
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const clearAll = async () => {
        const targetId = studentId || "23CSEBE274";
        setNotifications([]);
        try {
            await fetch(`${getApiBaseUrl()}/api/notifications/clear/${targetId}`, { method: "DELETE" });
            fetchNotifications(targetId);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("notificationsUpdated"));
            }
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    const isScholarshipNotif = (n) => {
        return (
            n.category === "scholarship_new" ||
            n.category === "scholarship_updated" ||
            n.event_type === "scholarship_added" ||
            n.event_type === "scholarship_edited" ||
            (n.title && (n.title.includes("New Scholarship") || n.title.includes("Scholarship Added") || n.title.includes("Scholarship Updated")))
        );
    };

    const isDocumentNotif = (n) => {
        return (
            n.category === "documents" ||
            n.event_type === "document_approved" ||
            n.event_type === "document_rejected" ||
            (n.title && n.title.toLowerCase().includes("document"))
        );
    };

    const isApplicationNotif = (n) => {
        return (
            n.category === "scholarship" ||
            n.badge_type === "application_status" ||
            (n.title && (n.title.toLowerCase().includes("application") || n.title.toLowerCase().includes("hardcopy"))) ||
            (!isScholarshipNotif(n) && !isDocumentNotif(n))
        );
    };

    const filteredNotifs = notifications.filter(n => {
        if (filter === "unread") return n.unread;
        if (filter === "scholarships") return isScholarshipNotif(n);
        if (filter === "documents") return isDocumentNotif(n);
        if (filter === "applications") return isApplicationNotif(n);
        return true;
    });

    const unreadCount = notifications.filter(n => n.unread).length;
    const schCount = notifications.filter(isScholarshipNotif).length;
    const docCount = notifications.filter(isDocumentNotif).length;
    const appCount = notifications.filter(isApplicationNotif).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            {/* HERO BANNER */}
            <section className="panel" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(91, 53, 232, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                
                <span className="badge" style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.3)', marginBottom: '12px' }}>
                    ⚡ Real-Time Notification Center
                </span>
                
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Notifications & Campus Alerts
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '850px', marginBottom: '16px' }}>
                    Live alerts for newly published scholarships, document verification reviews, approval/rejection explanations, and real-time application stage updates.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge success" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        🎓 {schCount} Scholarship Schemes
                    </span>
                    <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 12px', fontSize: '12px' }}>
                        📁 {docCount} Document Updates
                    </span>
                    <span className="badge warning" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        📋 {appCount} Application Feeds
                    </span>
                    <span className="badge" style={{ background: unreadCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)', color: unreadCount > 0 ? '#f87171' : 'var(--text-muted)', border: unreadCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>
                        {unreadCount} Unread Alerts
                    </span>
                </div>
            </section>

            {/* TOOLBAR & FILTER TABS */}
            <div className="toolbar" style={{ flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        className={`button ${filter === 'all' ? 'primary' : ''}`}
                        onClick={() => setFilter('all')}
                        style={{ fontSize: '12px', fontWeight: 700 }}
                    >
                        🌟 All Alerts ({notifications.length})
                    </button>
                    <button
                        className={`button ${filter === 'scholarships' ? 'primary' : ''}`}
                        onClick={() => setFilter('scholarships')}
                        style={{ fontSize: '12px', fontWeight: 700, background: filter === 'scholarships' ? '#10b981' : undefined }}
                    >
                        🎓 Scholarships ({schCount})
                    </button>
                    <button
                        className={`button ${filter === 'documents' ? 'primary' : ''}`}
                        onClick={() => setFilter('documents')}
                        style={{ fontSize: '12px', fontWeight: 700, background: filter === 'documents' ? '#38bdf8' : undefined, color: filter === 'documents' ? '#020817' : undefined }}
                    >
                        📁 Documents & Vault ({docCount})
                    </button>
                    <button
                        className={`button ${filter === 'applications' ? 'primary' : ''}`}
                        onClick={() => setFilter('applications')}
                        style={{ fontSize: '12px', fontWeight: 700, background: filter === 'applications' ? '#f59e0b' : undefined }}
                    >
                        📋 Applications ({appCount})
                    </button>
                    <button
                        className={`button ${filter === 'unread' ? 'primary' : ''}`}
                        onClick={() => setFilter('unread')}
                        style={{ fontSize: '12px', fontWeight: 700 }}
                    >
                        ⏳ Unread Only ({unreadCount})
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button className="button" onClick={markAllRead} style={{ fontSize: '12px' }}>
                        ✓ Mark All Read
                    </button>
                    <button className="button danger" onClick={clearAll} style={{ fontSize: '12px' }}>
                        🗑 Clear All
                    </button>
                </div>
            </div>

            {/* NOTIFICATIONS FEED */}
            <section className="panel">
                <div className="panel-header">
                    <div>
                        <div className="panel-title">Active Notifications ({filteredNotifs.length})</div>
                        <div className="panel-subtitle">Instant institutional feeds, approval statuses and actionable updates</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge success">🟢 Live Real-Time Feed</span>
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredNotifs.length === 0 ? (
                        <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <div className="empty-icon" style={{ fontSize: '42px', marginBottom: '12px' }}>🔔</div>
                            <div className="empty-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                                No notifications right now
                            </div>
                            <div className="empty-description" style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: '1.6' }}>
                                You are all caught up! Whenever a new scholarship is announced, or when an administrator verifies, approves, or rejects your documents, notifications will appear here in real-time.
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link href="/dashboard/scholarships" className="button primary" style={{ textDecoration: 'none' }}>
                                    🎓 Browse Scholarships
                                </Link>
                                <Link href="/dashboard/documents" className="button secondary" style={{ textDecoration: 'none' }}>
                                    📁 Open Digital Vault
                                </Link>
                            </div>
                        </div>
                    ) : (
                        filteredNotifs.map((n) => {
                            const isNewSch = isScholarshipNotif(n) && (n.category === "scholarship_new" || n.event_type === "scholarship_added" || (n.title && n.title.includes("New Scholarship")));
                            const isUpdatedSch = isScholarshipNotif(n) && !isNewSch;
                            const isDoc = isDocumentNotif(n);
                            const isDocRejected = isDoc && (n.title.toLowerCase().includes("reject") || (n.desc && n.desc.toLowerCase().includes("reject")));
                            const isDocApproved = isDoc && !isDocRejected;
                            const isApp = isApplicationNotif(n);

                            let borderColor = 'var(--border)';
                            let iconBg = 'rgba(91, 53, 232, 0.2)';
                            let iconColor = '#a78bfa';
                            let iconEmoji = n.icon || '🔔';

                            if (isNewSch) {
                                borderColor = 'rgba(16, 185, 129, 0.4)';
                                iconBg = 'rgba(16, 185, 129, 0.2)';
                                iconColor = '#10b981';
                                iconEmoji = '🎓';
                            } else if (isUpdatedSch) {
                                borderColor = 'rgba(245, 158, 11, 0.4)';
                                iconBg = 'rgba(245, 158, 11, 0.2)';
                                iconColor = '#f59e0b';
                                iconEmoji = '📝';
                            } else if (isDocApproved) {
                                borderColor = 'rgba(16, 185, 129, 0.4)';
                                iconBg = 'rgba(16, 185, 129, 0.2)';
                                iconColor = '#10b981';
                                iconEmoji = '✓';
                            } else if (isDocRejected) {
                                borderColor = 'rgba(239, 68, 68, 0.5)';
                                iconBg = 'rgba(239, 68, 68, 0.2)';
                                iconColor = '#ef4444';
                                iconEmoji = '✕';
                            } else if (isApp) {
                                borderColor = 'rgba(56, 189, 248, 0.4)';
                                iconBg = 'rgba(56, 189, 248, 0.2)';
                                iconColor = '#38bdf8';
                                iconEmoji = '📋';
                            }

                            const actionUrl = n.action_url || (isDoc ? '/dashboard/documents' : (isApp ? '/dashboard/applications' : '/dashboard/scholarships'));
                            const actionText = n.action_text || (isDocRejected ? 'Fix & Re-Upload in Vault →' : (isDoc ? 'View in Digital Vault →' : (isApp ? 'Track Application →' : 'View Scholarship & Apply →')));

                            return (
                                <div 
                                    key={n.id} 
                                    className="data-row" 
                                    style={{ 
                                        background: n.unread ? 'var(--primary-soft)' : 'var(--surface)', 
                                        borderColor: borderColor,
                                        borderWidth: '1.5px',
                                        padding: '18px 20px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px',
                                        transition: 'all 0.2s ease',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <div 
                                        className="data-icon" 
                                        style={{ 
                                            background: iconBg, 
                                            color: iconColor,
                                            fontSize: '22px',
                                            width: '46px',
                                            height: '46px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '12px',
                                            flexShrink: 0
                                        }}
                                    >
                                        {iconEmoji}
                                    </div>

                                    <div className="data-content" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <div className="data-title" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                                                {n.title}
                                            </div>
                                            {n.unread && <span className="badge warning" style={{ fontSize: '10px', padding: '2px 8px' }}>● NEW</span>}
                                            {isNewSch && <span className="badge success" style={{ fontSize: '10px', padding: '2px 8px' }}>🎓 NEW SCHOLARSHIP</span>}
                                            {isUpdatedSch && <span className="badge" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>📝 CRITERIA UPDATED</span>}
                                            {isDocApproved && <span className="badge success" style={{ fontSize: '10px', padding: '2px 8px' }}>✓ VAULT VERIFIED</span>}
                                            {isDocRejected && <span className="badge danger" style={{ fontSize: '10px', padding: '2px 8px' }}>✕ ACTION REQUIRED</span>}
                                            {isApp && <span className="badge" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>📋 APPLICATION</span>}
                                        </div>

                                        <div style={{ fontSize: '13px', color: isDocRejected ? '#fca5a5' : 'var(--text-secondary)', lineHeight: '1.5', marginTop: '6px' }}>
                                            {n.desc}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div className="data-meta" style={{ display: 'flex', gap: '8px' }}>
                                                <span className="badge" style={{ fontSize: '11px' }}>{n.time || "Recently"}</span>
                                            </div>

                                            <Link
                                                href={actionUrl}
                                                className={`button ${isDocRejected ? 'danger' : 'primary'}`}
                                                style={{ fontSize: '12px', padding: '6px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                                            >
                                                <span>{actionText}</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Notifications are synchronized in real-time with Sona College Scholarship Administration and AI Portal.
            </div>
        </div>
    );
}
