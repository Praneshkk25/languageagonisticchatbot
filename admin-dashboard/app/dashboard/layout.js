"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminDashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItemsPrimary = [
        { name: "Overview", href: "/dashboard", icon: "⌂" },
        { name: "Approvals", href: "/dashboard/approvals", icon: "✓", count: 5 },
        { name: "Scholarships", href: "/dashboard/scholarships", icon: "♢" },
        { name: "Learning Data", href: "/dashboard/learning", icon: "▤" },
        { name: "Students", href: "/dashboard/students", icon: "👥" },
    ];

    const getPageTitle = () => {
        if (pathname === '/dashboard') return { title: 'Overview', desc: 'College Admin Command Center & Analytics.' };
        if (pathname === '/dashboard/approvals') return { title: 'Approvals & Verification', desc: 'Review student document verification & scholarship requests.' };
        if (pathname === '/dashboard/scholarships') return { title: 'Scholarship Management', desc: 'Manage 14 scholarship categories and eligibility rules.' };
        if (pathname === '/dashboard/learning') return { title: 'AI Training & KB Data', desc: 'Upload college circulars, exam dates and policy FAQs.' };
        if (pathname === '/dashboard/students') return { title: 'Student Directory', desc: 'Manage enrolled student records and scholarship statuses.' };
        return { title: 'Admin Portal', desc: 'College Admin Management System.' };
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
                        <div className="brand-name">ADMIN</div>
                        <div className="brand-subtitle">PORTAL</div>
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
                    <div className="user-card">
                        <div className="avatar">AD</div>
                        <div className="user-info">
                            <div className="user-name">Admin Portal</div>
                            <div className="user-course">System Manager</div>
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
                            <input type="text" placeholder="Search admin records..." />
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
