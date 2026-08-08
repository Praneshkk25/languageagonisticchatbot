"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../LanguageContext";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState({ name: "Student Demo", id: "2023CS001", dept: "CSE - 2023CS001" });
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

    useEffect(() => {
        loadUserData();
        const handleUserUpdate = () => loadUserData();
        window.addEventListener("userProfileUpdated", handleUserUpdate);
        return () => window.removeEventListener("userProfileUpdated", handleUserUpdate);
    }, []);

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
        { name: "Notifications", href: "/dashboard/notifications", icon: "♧", count: 3 },
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

                    {/* USER CARD */}
                    <div className="user-card" onClick={() => router.push('/dashboard/settings')}>
                        <div className="avatar">{getInitials(user.name)}</div>
                        <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-course">{user.dept}</div>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⌄</span>
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

                        <div className="language">
                            <span>◉</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: '#d9deec', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="en" style={{ background: '#081229', color: '#fff' }}>English</option>
                                <option value="hi" style={{ background: '#081229', color: '#fff' }}>हिंदी</option>
                                <option value="ta" style={{ background: '#081229', color: '#fff' }}>தமிழ்</option>
                                <option value="te" style={{ background: '#081229', color: '#fff' }}>తెలుగు</option>
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
