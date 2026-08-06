"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, CheckSquare, ScrollText, BrainCircuit, GraduationCap, Users } from "lucide-react";

export default function AdminDashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: "Student Directory", href: "/dashboard/students", icon: <Users className="w-4 h-4" /> },
        { name: "Approvals", href: "/dashboard/approvals", icon: <CheckSquare className="w-4 h-4" /> },
        { name: "System Logs", href: "/dashboard/logs", icon: <ScrollText className="w-4 h-4" /> },
        { name: "Scholarships", href: "/dashboard/scholarships", icon: <GraduationCap className="w-4 h-4" /> },
        { name: "Knowledge Base", href: "/dashboard/learning", icon: <BrainCircuit className="w-4 h-4" /> },
    ];


    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand-icon">
                        <span style={{ fontSize: "1.1rem", color: "#fff", fontWeight: "900" }}>S</span>
                    </div>
                    <span>Sona Admin</span>
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
                                <span style={{ fontSize: "1.1rem", color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {/* Information Card */}
                    <div className="sidebar-info-card">
                        <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: "0.25rem" }}>Sona Campus System</p>
                        <p>Manage courses, student records, document approvals and AI knowledge base training.</p>
                    </div>

                    <div className="user-info">
                        <div className="avatar">AD</div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>System Admin</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            marginTop: '0.5rem',
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--accent-rose)',
                            background: 'rgba(244, 63, 94, 0.07)',
                            border: '1px solid rgba(244, 63, 94, 0.18)',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-area">
                <header className="top-bar">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                        {pathname === "/dashboard" ? "Dashboard Overview" :
                         pathname === "/dashboard/students" ? "Student Directory" :
                         pathname === "/dashboard/approvals" ? "Document Approvals" :
                         pathname === "/dashboard/logs" ? "System Activity Logs" :
                         pathname === "/dashboard/scholarships" ? "Scholarship Criteria Manager" :
                         pathname === "/dashboard/learning" ? "Knowledge Base" : "Admin Panel"}
                    </h2>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
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
