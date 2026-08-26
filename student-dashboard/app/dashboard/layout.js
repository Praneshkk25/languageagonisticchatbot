"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../LanguageContext";
import ThemeToggle from "../ThemeToggle";
import { getApiBaseUrl } from "@/lib/api";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState({ name: "Student", id: "", dept: "Student Portal" });
    const [unreadCount, setUnreadCount] = useState(0);
    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const loadUserData = () => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    setUser({
                        name: u.name || "Student",
                        id: u.id || u.admission_no || "",
                        dept: u.department ? `${u.department} - ${u.id || u.admission_no || ''}` : "Student Portal"
                    });
                } catch(e) {}
            }
        }
    };

    const fetchUnreadCount = async (sid) => {
        if (typeof document !== "undefined" && document.hidden) return;
        const targetId = sid || user.id;
        if (!targetId) return;
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/notifications/student/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const unread = data.filter(n => n.unread).length;
                    setUnreadCount(unread);
                }
            }
        } catch (e) {}
    };

    useEffect(() => {
        loadUserData();
        const sid = user.id || (typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "{}")?.admission_no);
        if (sid) fetchUnreadCount(sid);

        const handleUpdate = () => {
            loadUserData();
            const currSid = user.id || (typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "{}")?.admission_no);
            if (currSid) fetchUnreadCount(currSid);
        };

        window.addEventListener("userProfileUpdated", handleUpdate);
        window.addEventListener("notificationsUpdated", handleUpdate);

        const handleVisibility = () => {
            if (!document.hidden) {
                const currSid = user.id || (typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "{}")?.admission_no);
                if (currSid) fetchUnreadCount(currSid);
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        const interval = setInterval(() => {
            if (!document.hidden) {
                const currSid = user.id || (typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "{}")?.admission_no);
                if (currSid) fetchUnreadCount(currSid);
            }
        }, 15000);

        return () => {
            window.removeEventListener("userProfileUpdated", handleUpdate);
            window.removeEventListener("notificationsUpdated", handleUpdate);
            document.removeEventListener("visibilitychange", handleVisibility);
            clearInterval(interval);
        };
    }, [user.id, pathname]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showUserMenu && !e.target.closest('.user-dropdown-container')) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showUserMenu]);

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("is_first_login");
            localStorage.clear();
        }
        setShowUserMenu(false);
        router.push("/");
    };

    const getInitials = (name) => {
        if (!name) return "ST";
        return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const navItemsPrimary = [
        { key: "overview", defaultName: "Overview", href: "/dashboard", icon: "⌂" },
        { key: "aiAssistant", defaultName: "AI Assistant", href: "/dashboard/chat", icon: "◉" },
        { key: "applicationStatus", defaultName: "Application Status", href: "/dashboard/applications", icon: "📋" },
        { key: "scholarships", defaultName: "Scholarship", href: "/dashboard/scholarships", icon: "♢" },
        { key: "documents", defaultName: "Documents", href: "/dashboard/documents", icon: "▤" },
        { key: "chatHistory", defaultName: "Chat History", href: "/dashboard/history", icon: "◷" },
        { key: "notifications", defaultName: "Notifications", href: "/dashboard/notifications", icon: "♧", count: unreadCount > 0 ? unreadCount : null },
        { key: "helpSupport", defaultName: "Help & Support", href: "/dashboard/help", icon: "?" },
        { key: "settings", defaultName: "Settings", href: "/dashboard/settings", icon: "⚙" },
    ];

    const getPageTitle = () => {
        if (pathname === '/dashboard') return { title: t('overview') || 'Overview', desc: 'Welcome back to your campus student dashboard.' };
        if (pathname === '/dashboard/chat') return { title: t('aiAssistant') || 'AI Assistant', desc: 'Ask anything about college, admissions, events, or policies.' };
        if (pathname === '/dashboard/applications') return { title: t('applicationStatus') || 'Application Status', desc: 'Real-time 5-stage scholarship application tracking & disbursements.' };
        if (pathname === '/dashboard/history') return { title: t('chatHistory') || 'Chat History', desc: 'View your past conversations with AI Assistant.' };
        if (pathname === '/dashboard/scholarships') return { title: t('scholarships') || 'Scholarship Portal', desc: 'Find and verify academic resources.' };
        if (pathname === '/dashboard/documents') return { title: t('documents') || 'Digital Vault', desc: 'Secure document management system.' };
        if (pathname === '/dashboard/notifications') return { title: t('notifications') || 'Notifications', desc: 'Stay updated with active announcements and alerts.' };
        if (pathname === '/dashboard/help') return { title: t('helpSupport') || 'Help & Support', desc: 'Find instant answers to your questions or browse topics.' };
        if (pathname === '/dashboard/settings') return { title: t('settings') || 'Settings & Profile', desc: 'Manage your profile details, security and notification preferences.' };
        return { title: 'Student Portal', desc: 'Your personalized campus companion.' };
    };

    const pageMeta = getPageTitle();

    return (
        <div className="app">
            {/* MOBILE SIDEBAR OVERLAY */}
            <div 
                className={`sidebar-overlay ${mobileMenuOpen ? "active" : ""}`} 
                onClick={() => setMobileMenuOpen(false)} 
                aria-hidden="true"
            />

            {/* SIDEBAR */}
            <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
                <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                        <div className="brand-logo notranslate" translate="no" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer', background: '#ffffff', padding: '3px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/logo.webp" alt="Sona College Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>

                        <div>
                            <div className="brand-name notranslate" translate="no">SONA</div>
                            <div className="brand-subtitle notranslate" translate="no">COLLEGE</div>
                        </div>
                    </div>
                    {/* Mobile close button inside drawer */}
                    <button 
                        className="mobile-menu-btn" 
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ width: '32px', height: '32px', fontSize: '14px', marginLeft: 'auto' }}
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                {/* NAVIGATION */}
                <nav className="navigation">
                    {navItemsPrimary.map((item) => {
                        const isActive = pathname === item.href;
                        const label = t(item.key) || item.defaultName;
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`nav-item ${isActive ? "active" : ""}`}
                            >
                                <span className="nav-icon notranslate" translate="no">{item.icon}</span>
                                <span className="nav-text">{label}</span>
                                {item.count && (
                                    <span className="notification-count notranslate" translate="no">{item.count}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-divider"></div>

                    {/* USER CARD WITH LOG OUT DROPDOWN MENU */}
                    <div className="user-dropdown-container" style={{ position: 'relative' }}>
                        {showUserMenu && (
                            <div 
                                className="user-dropdown-menu"
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: 0,
                                    right: 0,
                                    marginBottom: '10px',
                                    background: 'rgba(11, 20, 42, 0.98)',
                                    border: '1.5px solid rgba(139, 92, 246, 0.45)',
                                    borderRadius: '14px',
                                    padding: '10px',
                                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(124, 58, 237, 0.25)',
                                    backdropFilter: 'blur(16px)',
                                    zIndex: 100
                                }}
                            >
                                <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '8px' }}>
                                    <div className="notranslate" translate="no" style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{user.name}</div>
                                    <div className="notranslate" translate="no" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{user.dept}</div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        setMobileMenuOpen(false);
                                        router.push('/dashboard/settings');
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#e2e8f0',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.18)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span>⚙️</span>
                                    <span>{t('settingsAndProfile') || 'Settings & Profile'}</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        color: '#f87171',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        marginTop: '6px',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                        e.currentTarget.style.color = '#f87171';
                                    }}
                                >
                                    <span>🚪</span>
                                    <span>{t('logOut') || 'Log Out'}</span>
                                </button>
                            </div>
                        )}

                        <div 
                            className="user-card" 
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', flex: 1, minWidth: 0 }}>
                                <div className="avatar notranslate" translate="no">{getInitials(user.name)}</div>
                                <div className="user-info">
                                    <div className="user-name notranslate" translate="no">{user.name}</div>
                                    <div className="user-course notranslate" translate="no">{user.dept}</div>
                                </div>
                            </div>
                            <span 
                                className="notranslate"
                                translate="no"
                                style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 'bold',
                                    color: showUserMenu ? '#c084fc' : 'var(--text-muted)',
                                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.25s ease, color 0.2s ease',
                                    padding: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Click to open menu"
                            >
                                ⌄
                            </span>
                        </div>
                    </div>

                    {/* ASK QUESTION CARD */}
                    <div className="ask-card" onClick={() => { setMobileMenuOpen(false); router.push('/dashboard/chat'); }}>
                        <div className="ask-icon notranslate" translate="no">?</div>
                        <div>
                            <div className="ask-title">{t('askAQuestion') || 'Ask a Question'}</div>
                            <div className="ask-subtitle">{t('startAConversation') || 'Start a conversation'}</div>
                        </div>
                    </div>

                    {/* CAMPUS ART */}
                    <div className="campus-art notranslate" translate="no">
                        <div className="campus-building notranslate" translate="no">🏛</div>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="main">
                {/* TOP BAR */}
                <header className="topbar">
                    <div className="topbar-header-row">
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                            <h1 className="page-title">{pageMeta.title}</h1>
                            <p className="page-description">{pageMeta.desc}</p>
                        </div>
                        <button 
                            className="mobile-menu-btn notranslate" 
                            translate="no"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle navigation drawer"
                        >
                            ☰
                        </button>
                    </div>

                    <div className="topbar-actions">
                        <div className="search">
                            <span className="search-icon notranslate" translate="no">⌕</span>
                            <input type="text" placeholder={t('searchAnything') || "Search anything..."} />
                        </div>

                        <ThemeToggle />

                        <div className="language notranslate" translate="no" style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px', padding: '0 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '9px' }}>
                            <span className="notranslate" translate="no" style={{ marginRight: '6px' }}>◉</span>
                            <select
                                className="notranslate"
                                translate="no"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    paddingRight: '6px'
                                }}
                            >
                                <option value="en" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>English</option>
                                <option value="hi" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>हिंदी (Hindi)</option>
                                <option value="ta" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>தமிழ் (Tamil)</option>
                                <option value="te" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>తెలుగు (Telugu)</option>
                                <option value="ml" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>മലയാളം (Malayalam)</option>
                                <option value="ar" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>العربية (Arabic)</option>
                                <option value="ne" className="notranslate" translate="no" style={{ background: 'var(--surface)', color: 'var(--text)' }}>नेपाली (Nepali)</option>
                            </select>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <section className="content">
                    {children}
                </section>
            </main>
        </div>
    );
}
