"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../LanguageContext";
import { Home, Bot, FileText, HelpCircle, LogOut, Languages, GraduationCap } from "lucide-react";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState({ name: "Student Demo", id: "2023CS001" });
    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    setUser(u);
                } catch(e) {}
            }
        }
    }, []);

    const getInitials = (name) => {
        if (!name) return "SD";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };


    const navItems = [
        { name: t('overview'), href: "/dashboard", icon: <Home className="w-4 h-4" /> },
        { name: t('scholarships') || "Scholarships", href: "/dashboard/scholarships", icon: <GraduationCap className="w-4 h-4" /> },
        { name: t('aiAssistant'), href: "/dashboard/chat", icon: <Bot className="w-4 h-4" /> },
        { name: t('documents'), href: "/dashboard/documents", icon: <FileText className="w-4 h-4" /> },
        { name: t('helpCenter'), href: "/dashboard/help", icon: <HelpCircle className="w-4 h-4" /> },
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand-icon">
                        <span style={{ fontSize: "1.1rem", color: "#fff", fontWeight: "900" }}>S</span>
                    </div>
                    <span>Campus Connect</span>
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
                                <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {/* Information Card */}
                    <div className="sidebar-info-card">
                        <p style={{ fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>Student Hub</p>
                        <p>Ask AI support, download academic transcripts, view fee details, and track your attendance.</p>
                    </div>

                    <div className="user-info">
                        <div className="avatar">{getInitials(user.name)}</div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.id}</p>
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
                        <span>{t('signOut')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-area">
                <header className="top-bar">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-extrabold tracking-tight" style={{ fontWeight: 700, letterSpacing: '-0.025em', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                            {pathname === '/dashboard/chat' ? t('aiAssistant') :
                             pathname === '/dashboard/scholarships' ? 'Scholarships Hub (14 Categories)' :
                             pathname === '/dashboard/documents' ? 'Digital Vault' :
                             pathname === '/dashboard/help' ? 'Help Center' : t('overview')}
                        </h2>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-light)' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div
                            className="flex items-center gap-2 p-1.5 rounded-full border px-3 notranslate"
                            style={{
                                background: 'rgba(255,255,255,0.85)',
                                border: '1.5px solid rgba(20,184,166,0.22)',
                                boxShadow: '0 2px 10px rgba(20,184,166,0.10)'
                            }}
                        >
                            <Languages className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                            <select
                                className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer appearance-none pr-4 relative notranslate"
                                style={{ color: 'var(--text-main)' }}
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="ta">தமிழ் (Tamil)</option>
                                <option value="te">తెలుగు (Telugu)</option>
                                <option value="ne">नेपाली (Nepali)</option>
                                <option value="ar">العربية (Arabic)</option>
                                <option value="ml">മലയാളം (Malayalam)</option>
                            </select>
                        </div>

                        <div className="h-10 w-10 glass rounded-xl flex items-center justify-center shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                            <span className="text-md">🔔</span>
                        </div>
                    </div>
                </header>

                <main className="page-scroll">
                    {children}
                </main>
            </div>
        </div>
    );
}
