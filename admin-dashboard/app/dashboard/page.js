"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '10px' }}>✦ Admin Command Center</span>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    College <span style={{ color: '#825cfb' }}>Admin Portal</span> Management
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '650px', marginBottom: '18px' }}>
                    Review student document approvals, manage 14 scholarship categories, and monitor AI chatbot analytics.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="button primary" onClick={() => router.push('/dashboard/approvals')}>
                        Manage Approvals (5 Pending)
                    </button>
                    <button className="button" onClick={() => router.push('/dashboard/scholarships')}>
                        Scholarships Hub
                    </button>
                </div>
            </section>

            {/* STATS OVERVIEW */}
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>System Overview</div>
                <div className="grid grid-4">
                    <div className="feature-card">
                        <div className="feature-icon">✓</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>5</div>
                        <div className="feature-description">Pending Approvals</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎓</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>14</div>
                        <div className="feature-description">Active Scholarship Categories</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>3.2K</div>
                        <div className="feature-description">Enrolled Students</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">💬</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>1,420</div>
                        <div className="feature-description">Queries Handled This Month</div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Quick Admin Actions</div>
                <div className="grid grid-3">
                    <div className="feature-card" onClick={() => router.push('/dashboard/approvals')} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">✓</div>
                        <div className="feature-title">Student Approvals</div>
                        <div className="feature-description">Review uploaded certificates and income declarations.</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#bcaaff' }}>Review Now →</div>
                    </div>

                    <div className="feature-card" onClick={() => router.push('/dashboard/scholarships')} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">🎓</div>
                        <div className="feature-title">Scholarship Schemes</div>
                        <div className="feature-description">Update eligibility rules and application links.</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#bcaaff' }}>Manage Schemes →</div>
                    </div>

                    <div className="feature-card" onClick={() => router.push('/dashboard/learning')} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon">▤</div>
                        <div className="feature-title">AI Training Data</div>
                        <div className="feature-description">Add new college circulars, exam dates and FAQs.</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#bcaaff' }}>Update Data →</div>
                    </div>
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Admin System Active — All Actions Logged
            </div>
        </div>
    );
}
