"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import { getApiBaseUrl } from "@/lib/api";

export default function AdminDashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingAppsCount, setPendingAppsCount] = useState(0);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const fetchCounts = async () => {
        if (typeof document !== "undefined" && document.hidden) return;
        try {
            const [docsRes, appsRes] = await Promise.all([
                fetch(`${getApiBaseUrl()}/documents/admin/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/applications/admin/all`).catch(() => null)
            ]);

            if (docsRes && docsRes.ok) {
                const docs = await docsRes.json();
                if (Array.isArray(docs)) {
                    const count = docs.filter(d => d.status === "Pending" || d.status === "pending").length;
                    setPendingCount(count);
                }
            }

            if (appsRes && appsRes.ok) {
                const apps = await appsRes.json();
                if (Array.isArray(apps)) {
                    const count = apps.filter(a => a.stage < 4).length;
                    setPendingAppsCount(count);
                }
            }
        } catch (e) {}
    };

    useEffect(() => {
        fetchCounts();

        const handleVisibilityChange = () => {
            if (!document.hidden) fetchCounts();
        };

        const interval = setInterval(fetchCounts, 35000);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

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
            localStorage.clear();
        }
        setShowUserMenu(false);
        router.push("/");
    };

    const navItemsPrimary = [
        { name: "Overview", href: "/dashboard", icon: "⌂" },
        { name: "Applications", href: "/dashboard/applications", icon: "📋", count: pendingAppsCount > 0 ? pendingAppsCount : null },
        { name: "Approvals", href: "/dashboard/approvals", icon: "✓", count: pendingCount > 0 ? pendingCount : null },
        { name: "Scholarships", href: "/dashboard/scholarships", icon: "♢" },
        { name: "Learning Data", href: "/dashboard/learning", icon: "▤" },
        { name: "Students", href: "/dashboard/students", icon: "👥" },
    ];

    const getPageTitle = () => {
        if (pathname === '/dashboard') return { title: 'Overview', desc: 'College Admin Command Center & Analytics.' };
        if (pathname === '/dashboard/applications') return { title: 'Application Pipeline', desc: 'Manage 5-stage scholarship application lifecycle & disbursements.' };
        if (pathname === '/dashboard/approvals') return { title: 'Approvals & Verification', desc: 'Review student document verification & scholarship requests.' };
        if (pathname === '/dashboard/scholarships') return { title: 'Scholarship Management', desc: 'Manage 14 scholarship categories and eligibility rules.' };
        if (pathname === '/dashboard/learning') return { title: 'AI Training & KB Data', desc: 'Upload college circulars, exam dates and policy FAQs.' };
        if (pathname === '/dashboard/students') return { title: 'Student Directory', desc: 'Manage enrolled student records and scholarship statuses.' };
        return { title: 'Admin Portal', desc: 'College Admin Management System.' };
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
                        <div className="brand-logo" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer', background: '#ffffff', padding: '3px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/logo.webp" alt="Sona College Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>

                        <div>
                            <div className="brand-name">SONA</div>
                            <div className="brand-subtitle">ADMIN</div>
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
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
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
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Admin Portal</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>System Manager</div>
                                </div>

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
                                <div className="avatar">AD</div>
                                <div className="user-info">
                                    <div className="user-name">Admin Portal</div>
                                    <div className="user-course">System Manager</div>
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
                    <div className="topbar-header-row">
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                            <h1 className="page-title">{pageMeta.title}</h1>
                            <p className="page-description">{pageMeta.desc}</p>
                        </div>
                        <button 
                            className="mobile-menu-btn" 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle navigation drawer"
                        >
                            ☰
                        </button>
                    </div>

                    <div className="topbar-actions">
                        <div className="search">
                            <span className="search-icon">⌕</span>
                            <input type="text" placeholder="Search admin records..." />
                        </div>
                        <ThemeToggle />
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
