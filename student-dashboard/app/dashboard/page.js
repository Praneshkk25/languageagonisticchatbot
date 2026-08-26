"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";

export default function DashboardHome() {
    const router = useRouter();
    const [completionPct, setCompletionPct] = useState(60);
    const [missingFields, setMissingFields] = useState([]);
    const [studentMetrics, setStudentMetrics] = useState({
        queries: 0,
        scholarships: 0,
        documents: 0,
        students: 0
    });

    useEffect(() => {
        let userId = "";
        if (typeof window !== "undefined") {
            const uStr = localStorage.getItem("user");
            if (uStr) {
                try {
                    const u = JSON.parse(uStr);
                    userId = u.id || u.admission_no || "";

                    const checks = [
                        { label: "Community / Caste Category", val: u.caste_category || u.caste || u.quota },
                        { label: "Family Annual Income", val: u.family_income || u.income },
                        { label: "CGPA / Academic Score", val: u.cgpa },
                        { label: "Bank Account & IFSC", val: u.bank_account_no || u.bank_acc },
                        { label: "Aadhaar Card Linked", val: u.aadhaar_no || u.aadhaar }
                    ];

                    let filled = 0;
                    const missing = [];
                    checks.forEach(c => {
                        if (c.val && String(c.val).trim() !== "" && c.val !== "0" && c.val !== 0) {
                            filled++;
                        } else {
                            missing.push(c.label);
                        }
                    });
                    const pct = Math.round((filled / checks.length) * 100);
                    setCompletionPct(pct);
                    setMissingFields(missing);
                } catch(e) {}
            }
        }

        fetchStudentOverviewMetrics(userId);
    }, []);

    const fetchStudentOverviewMetrics = async (userId) => {
        try {
            const [logsRes, schRes, docsRes, studentsRes] = await Promise.all([
                fetch(`${getApiBaseUrl()}/api/logs/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/scholarships/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/documents/student/${userId}`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/students/all`).catch(() => null)
            ]);

            let queries = 0;
            if (logsRes && logsRes.ok) {
                const logs = await logsRes.json();
                if (Array.isArray(logs)) queries = logs.length;
            }

            let scholarships = 0;
            if (schRes && schRes.ok) {
                const schs = await schRes.json();
                if (Array.isArray(schs)) scholarships = schs.length;
            }

            let documents = 0;
            if (docsRes && docsRes.ok) {
                const docs = await docsRes.json();
                if (Array.isArray(docs)) documents = docs.length;
            }

            let students = 0;
            if (studentsRes && studentsRes.ok) {
                const stds = await studentsRes.json();
                if (Array.isArray(stds)) students = stds.length;
            }

            setStudentMetrics({ queries, scholarships, documents, students });
        } catch (e) {
            console.error("Error fetching student overview metrics:", e);
        }
    };

    const handlePromptClick = (question) => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("pending_chat_query", question);
        }
        router.push("/dashboard/chat");
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            
            {/* 1. HERO BANNER CARD */}
            <div className="panel" style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '28px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                flexWrap: 'wrap'
            }}>
                {/* Hero Left Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1 1 280px', minWidth: '240px', zIndex: 2 }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.25, letterSpacing: '-0.5px' }}>
                        Your <span style={{ color: 'var(--primary)' }}>Smart College</span> Assistant
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, fontWeight: 500 }}>
                        Get instant answers, find scholarships and upload documents - all in one place.
                    </p>
                    <div style={{ paddingTop: '4px' }}>
                        <Link 
                            href="/dashboard/chat" 
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 22px',
                                borderRadius: '12px',
                                background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)'
                            }}
                        >
                            <span>Start Chatting</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>

                {/* Hero Right Mascot & Speech Bubble */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2, flex: '1 1 auto', justifyContent: 'flex-start' }}>
                    {/* Speech Bubble */}
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '16px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        maxWidth: '160px',
                        lineHeight: 1.4
                    }}>
                        Hello! 👋<br/>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500 }}>I'm your AI Assistant. How can I help you?</span>
                    </div>

                    {/* Fixed Size Robot SVG Mascot */}
                    <div style={{ width: '100px', height: '100px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100px', height: '100px', display: 'block' }}>
                            <rect x="50" y="40" width="100" height="75" rx="24" fill="url(#botHeadGrad)" stroke="#6366f1" strokeWidth="2" />
                            <circle cx="100" cy="25" r="7" fill="#818cf8" />
                            <line x1="100" y1="25" x2="100" y2="40" stroke="#818cf8" strokeWidth="3" />
                            <circle cx="42" cy="77" r="7" fill="#4f46e5" />
                            <circle cx="158" cy="77" r="7" fill="#4f46e5" />
                            <rect x="62" y="52" width="76" height="50" rx="16" fill="#090b15" />
                            <circle cx="82" cy="75" r="7" fill="#38bdf8" />
                            <circle cx="118" cy="75" r="7" fill="#38bdf8" />
                            <circle cx="84" cy="73" r="2.5" fill="#ffffff" />
                            <circle cx="120" cy="73" r="2.5" fill="#ffffff" />
                            <path d="M90 88 C95 94, 105 94, 110 88" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                            <rect x="60" y="122" width="80" height="60" rx="20" fill="url(#botHeadGrad)" stroke="#6366f1" strokeWidth="2" />
                            <circle cx="100" cy="152" r="14" fill="#4f46e5" />
                            <path d="M94 152 H106 M97 148 V156 M103 149 V155" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                            <path d="M140 135 Q165 110 170 95" stroke="#818cf8" strokeWidth="10" strokeLinecap="round" />
                            <circle cx="170" cy="95" r="8" fill="#a855f7" />
                            <defs>
                                <linearGradient id="botHeadGrad" x1="50" y1="40" x2="150" y2="115" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#ffffff" />
                                    <stop offset="0.7" stopColor="#e0e7ff" />
                                    <stop offset="1" stopColor="#c7d2fe" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>

            {/* PROFILE COMPLETION STATUS CARD */}
            <div className="panel" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className="badge warning">Profile Completion Status</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: completionPct === 100 ? 'var(--success)' : 'var(--primary)' }}>
                                {completionPct}% Completed
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ height: '10px', background: 'var(--surface-2)', borderRadius: '10px', overflow: 'hidden', margin: '10px 0 14px', border: '1px solid var(--border)' }}>
                            <div style={{
                                width: `${completionPct}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)',
                                borderRadius: '10px',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>

                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {completionPct === 100 ? (
                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Your profile is 100% complete! All scholarship & verification criteria met.</span>
                            ) : (
                                <span>Pending profile fields: <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{missingFields.join(", ") || "Guardian & Bank details"}</strong></span>
                            )}
                        </div>
                    </div>

                    <div>
                        <button 
                            className="button primary" 
                            onClick={() => router.push('/dashboard/settings')}
                            style={{ padding: '12px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>⚙️ Complete Profile</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. QUICK ACCESS GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>⚡</span>
                    <span>Quick Access</span>
                </div>

                <div className="grid grid-4">
                    {/* Card 1: AI Assistant */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/chat')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>🤖</div>
                            <div className="feature-title">AI Assistant</div>
                            <div className="feature-description">Ask me anything about college, admissions, events, or policies.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Chat Now</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Card 2: Application Status */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/applications')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#db2777' }}>📋</div>
                            <div className="feature-title">Application Status</div>
                            <div className="feature-description">Track real-time 5-stage scholarship lifecycle & DBT grants.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: '#db2777', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Track Status</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Card 3: Scholarship */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/scholarships')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>🎓</div>
                            <div className="feature-title">Scholarships</div>
                            <div className="feature-description">Find and apply for the best graduation scholarships available.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Explore Schemes</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Card 4: Documents Upload */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/documents')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' }}>📄</div>
                            <div className="feature-title">Digital Vault</div>
                            <div className="feature-description">Upload and verify your important certificates and forms.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Vault Files</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. ANNOUNCEMENT BANNER */}
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        📢
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Latest Announcement</div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Scholarship portal for the year 2025–26 is now open.</div>
                    </div>
                </div>

                <button className="button" onClick={() => router.push('/dashboard/scholarships')}>
                    View Details
                </button>
            </div>

            {/* 4. OVERVIEW STATS GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Overview</div>

                <div className="grid grid-4">
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' }}>💬</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>{studentMetrics.queries}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Questions Answered</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>🎓</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>{studentMetrics.scholarships}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Scholarships Available</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c' }}>📄</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>{studentMetrics.documents}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Vault Documents Uploaded</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' }}>👥</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>{studentMetrics.students}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Registered Students</div>
                    </div>
                </div>
            </div>

            {/* 5. TRY ASKING PROMPTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', flex: 1 }}>Try Asking</div>
                    <Link href="/dashboard/chat" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                        See all suggestions →
                    </Link>
                </div>

                <div className="grid grid-2">
                    <div className="data-row" onClick={() => handlePromptClick("What are the upcoming events in college?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📅</div>
                            <div className="data-title">What are the upcoming events in college?</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("Tell me about the placement cell.")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">💼</div>
                            <div className="data-title">Tell me about the placement cell.</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("How can I apply for a scholarship?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">🎓</div>
                            <div className="data-title">How can I apply for a scholarship?</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("How can I get my TC?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📄</div>
                            <div className="data-title">How can I get my TC?</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("What documents are required for Bonafide?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📄</div>
                            <div className="data-title">What documents are required for Bonafide?</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("Where can I find the academic calendar?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📅</div>
                            <div className="data-title">Where can I find the academic calendar?</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>→</span>
                    </div>
                </div>
            </div>

            {/* 6. FOOTER DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Your data is secure and confidential
            </div>
        </div>
    );
}
