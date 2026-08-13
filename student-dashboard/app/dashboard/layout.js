"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../LanguageContext";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState({ name: "Student Demo", id: "2023CS001", dept: "CSE - 2023CS001" });
    const [unreadCount, setUnreadCount] = useState(0);
    const { language, setLanguage } = useLanguage();

    const loadUserData = () => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    setUser({
                        name: u.name || "Student Demo",
                        id: u.id || "2023CS001",
                        dept: u.department ? `${u.department} - ${u.id || '2023CS001'}` : "CSE - 2023CS001"
                    });
                } catch(e) {}
            }
        }
    };

    const fetchUnreadCount = async (sid) => {
        const targetId = sid || user.id || "2023CS001";
        try {
            const res = await fetch(`http://localhost:8000/api/notifications/student/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                const unread = data.filter(n => n.unread).length;
                setUnreadCount(unread);
            }
        } catch (e) {}
    };

    useEffect(() => {
        loadUserData();
        fetchUnreadCount(user.id);

        const handleUserUpdate = () => {
            loadUserData();
            fetchUnreadCount(user.id);
        };
        window.addEventListener("userProfileUpdated", handleUserUpdate);

        const interval = setInterval(() => {
            fetchUnreadCount(user.id);
        }, 5000);

        return () => {
            window.removeEventListener("userProfileUpdated", handleUserUpdate);
            clearInterval(interval);
        };
    }, [user.id]);

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
        if (!name) return "SD";
        return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const navItemsPrimary = [
        { name: "Overview", href: "/dashboard", icon: "⌂" },
        { name: "AI Assistant", href: "/dashboard/chat", icon: "◉" },
        { name: "Scholarship", href: "/dashboard/scholarships", icon: "♢" },
        { name: "Documents", href: "/dashboard/documents", icon: "▤" },
        { name: "Chat History", href: "/dashboard/history", icon: "◷" },
        { name: "Notifications", href: "/dashboard/notifications", icon: "♧", count: unreadCount > 0 ? unreadCount : null },
        { name: "Help & Support", href: "/dashboard/help", icon: "?" },
        { name: "Settings", href: "/dashboard/settings", icon: "⚙" },
    ];

    const getPageTitle = () => {
        if (pathname === '/dashboard') return { title: 'Overview', desc: 'Welcome back to your campus student dashboard.' };
        if (pathname === '/dashboard/chat') return { title: 'AI Assistant', desc: 'Ask anything about college, admissions, events, or policies.' };
        if (pathname === '/dashboard/history') return { title: 'Chat History', desc: 'View your past conversations with AI Assistant.' };
        if (pathname === '/dashboard/scholarships') return { title: 'Scholarship Portal', desc: 'Find and verify academic resources.' };
        if (pathname === '/dashboard/documents') return { title: 'Digital Vault', desc: 'Secure document management system.' };
        if (pathname === '/dashboard/notifications') return { title: 'Notifications', desc: 'Stay updated with active announcements and alerts.' };
        if (pathname === '/dashboard/help') return { title: 'Help & Support', desc: 'Find instant answers to your questions or browse topics.' };
        if (pathname === '/dashboard/settings') return { title: 'Settings & Profile', desc: 'Manage your profile details, security and notification preferences.' };
        return { title: 'Student Portal', desc: 'Your personalized campus companion.' };
    };

    const pageMeta = getPageTitle();

    return (
        <div className="app">
            {/* SIDEBAR */}
            <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
                <div className="brand">
                    <div className="brand-logo" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
                        <span>◆</span>
                    </div>

                    <div>
                        <div className="brand-name">COLLEGE</div>
                        <div className="brand-subtitle">CHATBOT</div>
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="navigation">
                    {navItemsPrimary.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`nav-item ${isActive ? "active" : ""}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-text">{item.name}</span>
                                {item.count && (
                                    <span className="notification-count">{item.count}</span>
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
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{user.name}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{user.dept}</div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
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
                                    <span>Settings & Profile</span>
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
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}

                        <div 
                            className="user-card" 
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', flex: 1, minWidth: 0 }}>
                                <div className="avatar">{getInitials(user.name)}</div>
                                <div className="user-info">
                                    <div className="user-name">{user.name}</div>
                                    <div className="user-course">{user.dept}</div>
                                </div>
                            </div>
                            <span 
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
                    <div className="ask-card" onClick={() => router.push('/dashboard/chat')}>
                        <div className="ask-icon">?</div>
                        <div>
                            <div className="ask-title">Ask a Question</div>
                            <div className="ask-subtitle">Start a conversation</div>
                        </div>
                    </div>

                    {/* CAMPUS ART */}
                    <div className="campus-art">
                        <div className="campus-building">🏛</div>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="main">
                {/* TOP BAR */}
                <header className="topbar">
                    <div>
                        <h1 className="page-title">{pageMeta.title}</h1>
                        <p className="page-description">{pageMeta.desc}</p>
                    </div>

                    <div className="topbar-actions">
                        <div className="search">
                            <span className="search-icon">⌕</span>
                            <input type="text" placeholder="Search anything..." />
                        </div>

                        <div className="language notranslate" translate="no">
                            <span>◉</span>
                            <select
                                className="notranslate"
                                translate="no"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: '#d9deec', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="en" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>English</option>
                                <option value="hi" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>हिंदी (Hindi)</option>
                                <option value="ta" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>தமிழ் (Tamil)</option>
                                <option value="te" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>తెలుగు (Telugu)</option>
                                <option value="ml" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>മലയാളം (Malayalam)</option>
                                <option value="ar" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>العربية (Arabic)</option>
                                <option value="ne" className="notranslate" translate="no" style={{ background: '#081229', color: '#fff' }}>नेपाली (Nepali)</option>
                            </select>
                            <span>⌄</span>
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
