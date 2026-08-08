"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
    const router = useRouter();

    const handlePromptClick = (question) => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("pending_chat_query", question);
        }
        router.push("/dashboard/chat");
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
            
            {/* 1. HERO BANNER CARD */}
            <div style={{
                background: 'linear-gradient(135deg, #0e122b 0%, #17163a 50%, #121530 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '32px 36px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                {/* Hero Left Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '580px', zIndex: 2 }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.5px' }}>
                        Your <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Smart College</span> Assistant
                    </h1>
                    <p style={{ color: '#a5aec7', fontSize: '13px', lineHeight: 1.6, fontWeight: 500 }}>
                        Get instant answers, find scholarships and upload documents - all in one place.
                    </p>
                    <div style={{ paddingTop: '6px' }}>
                        <Link 
                            href="/dashboard/chat" 
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 24px',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2, flexShrink: 0 }}>
                    {/* Speech Bubble */}
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(10px)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#ffffff',
                        maxWidth: '180px',
                        lineHeight: 1.4
                    }}>
                        Hello! 👋<br/>
                        <span style={{ color: '#a5aec7', fontSize: '11px', fontWeight: 400 }}>I'm your AI Assistant. How can I help you?</span>
                    </div>

                    {/* Fixed Size Robot SVG Mascot */}
                    <div style={{ width: '140px', height: '140px', maxWidth: '140px', maxHeight: '140px', flexShrink: 0, overflow: 'hidden' }}>
                        <svg width="140" height="140" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '140px', height: '140px', display: 'block' }}>
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

            {/* 2. QUICK ACCESS GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#a855f7' }}>⚡</span>
                    <span>Quick Access</span>
                </div>

                <div className="grid grid-3">
                    {/* Card 1: AI Assistant */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/chat')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7' }}>🤖</div>
                            <div className="feature-title" style={{ fontSize: '15px', marginTop: '10px' }}>AI Assistant</div>
                            <div className="feature-description">Ask me anything about college, admissions, events, or policies.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: '#bcaaff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Chat Now</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Card 2: Scholarship */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/scholarships')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>🎓</div>
                            <div className="feature-title" style={{ fontSize: '15px', marginTop: '10px' }}>Scholarship</div>
                            <div className="feature-description">Find and apply for the best scholarships available.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: '#bcaaff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Explore Now</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Card 3: Documents Upload */}
                    <div className="feature-card" onClick={() => router.push('/dashboard/documents')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>📄</div>
                            <div className="feature-title" style={{ fontSize: '15px', marginTop: '10px' }}>Documents Upload</div>
                            <div className="feature-description">Upload and verify your important documents securely.</div>
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, color: '#bcaaff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Upload Now</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. ANNOUNCEMENT BANNER */}
            <div style={{
                background: '#091329',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        📢
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Latest Announcement</div>
                        <div style={{ fontSize: '12px', color: '#a5aec7', marginTop: '2px' }}>Scholarship portal for the year 2025-26 is now open.</div>
                    </div>
                </div>

                <button className="button" onClick={() => router.push('/dashboard/scholarships')}>
                    View Details
                </button>
            </div>

            {/* 4. OVERVIEW STATS GRID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Overview</div>

                <div className="grid grid-4">
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>💬</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>128</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Questions Answered This Month</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>🎓</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>24</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Scholarships Available</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' }}>📄</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>15</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Documents Uploaded</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa' }}>👥</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>3.2K</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Active Students</div>
                    </div>
                </div>
            </div>

            {/* 5. TRY ASKING PROMPTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', flex: 1 }}>Try Asking</div>
                    <Link href="/dashboard/chat" style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textDecoration: 'none' }}>
                        See all suggestions →
                    </Link>
                </div>

                <div className="grid grid-2">
                    <div className="data-row" onClick={() => handlePromptClick("What are the upcoming events in college?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📅</div>
                            <div className="data-title">What are the upcoming events in college?</div>
                        </div>
                        <span style={{ color: '#707b98' }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("Tell me about the placement cell.")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">💼</div>
                            <div className="data-title">Tell me about the placement cell.</div>
                        </div>
                        <span style={{ color: '#707b98' }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("How can I apply for a scholarship?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">🎓</div>
                            <div className="data-title">How can I apply for a scholarship?</div>
                        </div>
                        <span style={{ color: '#707b98' }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("How can I get my TC?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📄</div>
                            <div className="data-title">How can I get my TC?</div>
                        </div>
                        <span style={{ color: '#707b98' }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("What documents are required for Bonafide?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📄</div>
                            <div className="data-title">What documents are required for Bonafide?</div>
                        </div>
                        <span style={{ color: '#707b98' }}>→</span>
                    </div>

                    <div className="data-row" onClick={() => handlePromptClick("Where can I find the academic calendar?")} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="data-icon">📅</div>
                            <div className="data-title">Where can I find the academic calendar?</div>
                        </div>
                        <span style={{ color: '#707b98' }}>→</span>
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
