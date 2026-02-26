"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: "🏠" },
        { name: "AI Assistant", href: "/dashboard/chat", icon: "🤖" },
        { name: "Documents", href: "/dashboard/documents", icon: "📄" },
        { name: "Help Center", href: "/dashboard/help", icon: "❓" },
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    Campus Connect
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${isActive ? "active" : ""}`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="avatar">SD</div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Student Demo</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2023CS001</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            marginTop: '1rem',
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            color: '#ef4444',
                            background: '#fef2f2',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                        }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-area">
                <header className="top-bar">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Student Dashboard</h2>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>

                <main className="page-scroll">
                    {children}
                </main>
            </div>
        </div>
    );
}
