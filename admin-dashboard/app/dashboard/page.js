"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        pending: 0,
        applications: 0,
        scholarships: 0,
        students: 0,
        queries: 0
    });

    const [deptStats, setDeptStats] = useState([
        { dept: "Computer Science & Engineering (CSE)", count: 0, percent: 0, color: "#6366f1" },
        { dept: "Information Tech & AI/DS (IT & AI-DS)", count: 0, percent: 0, color: "#38bdf8" },
        { dept: "Electronics & Communication (ECE)", count: 0, percent: 0, color: "#a855f7" },
        { dept: "Electrical & Electronics (EEE)", count: 0, percent: 0, color: "#eab308" },
        { dept: "Mechanical & Safety Engg (MECH)", count: 0, percent: 0, color: "#f59e0b" },
        { dept: "Mechatronics Engineering (MCT)", count: 0, percent: 0, color: "#ec4899" },
        { dept: "Civil Engineering (CIVIL)", count: 0, percent: 0, color: "#10b981" },
        { dept: "Biomedical Engineering (BME)", count: 0, percent: 0, color: "#06b6d4" },
        { dept: "Fashion Technology (FT)", count: 0, percent: 0, color: "#8b5cf6" },
        { dept: "Management Studies & MCA (MBA/MCA)", count: 0, percent: 0, color: "#64748b" }
    ]);
    const [budgetStats, setBudgetStats] = useState({
        totalSanctioned: 0,
        totalDisbursed: 0,
        verifiedCount: 0,
        pendingCount: 0,
        disbursementPercent: 0,
        pendingRelease: 0
    });

    const parseAmount = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const clean = String(val).replace(/[^0-9.]/g, '');
        return parseFloat(clean) || 0;
    };

    useEffect(() => {
        fetchAdminMetrics();

        const handleVisibility = () => {
            if (!document.hidden) fetchAdminMetrics();
        };

        const interval = setInterval(() => {
            if (!document.hidden) fetchAdminMetrics();
        }, 45000);

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    const fetchAdminMetrics = async () => {
        if (typeof document !== "undefined" && document.hidden) return;
        try {
            const [docsRes, appsRes, schRes, studentsRes, logsRes] = await Promise.all([
                fetch(`${getApiBaseUrl()}/documents/admin/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/applications/admin/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/scholarships/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/students/all`).catch(() => null),
                fetch(`${getApiBaseUrl()}/api/logs/all`).catch(() => null)
            ]);

            let pending = 0;
            if (docsRes && docsRes.ok) {
                const docs = await docsRes.json();
                if (Array.isArray(docs)) {
                    pending = docs.filter(d => d.status === "Pending" || d.status === "pending").length;
                }
            }

            let applications = 0;
            let rawApps = [];
            if (appsRes && appsRes.ok) {
                const apps = await appsRes.json();
                if (Array.isArray(apps)) {
                    applications = apps.length;
                    rawApps = apps;
                }
            }

            let scholarships = 0;
            if (schRes && schRes.ok) {
                const schs = await schRes.json();
                if (Array.isArray(schs)) scholarships = schs.length;
            }

            let students = 0;
            let rawStudents = [];
            if (studentsRes && studentsRes.ok) {
                const stds = await studentsRes.json();
                if (Array.isArray(stds)) {
                    students = stds.length;
                    rawStudents = stds;
                }
            }

            let queries = 0;
            if (logsRes && logsRes.ok) {
                const logs = await logsRes.json();
                if (Array.isArray(logs)) {
                    queries = logs.filter(l => l.action_type === "CHAT" || l.action_type === "APPLICATION_SUBMIT").length;
                }
            }

            // DYNAMIC DEPARTMENT VOLUME CALCULATION FROM LIVE DATA
            const deptCountMap = {
                "CSE": 0,
                "IT_AIDS": 0,
                "ECE": 0,
                "EEE": 0,
                "MECH": 0,
                "MCT": 0,
                "CIVIL": 0,
                "BME": 0,
                "FT": 0,
                "MGMT": 0
            };

            const targetSource = rawApps.length > 0 ? rawApps : rawStudents;
            targetSource.forEach(item => {
                const d = (item.department || item.dept || (item.student_id ? item.student_id.slice(2, 5) : "CSE") || "CSE").toUpperCase();
                if (d.includes("MCT") || d.includes("MECHATRONIC")) deptCountMap["MCT"] = (deptCountMap["MCT"] || 0) + 1;
                else if (d.includes("BME") || d.includes("BIOMED") || d.includes("BIO MEDICAL")) deptCountMap["BME"] = (deptCountMap["BME"] || 0) + 1;
                else if (d.includes("FT") || d.includes("FASHION")) deptCountMap["FT"] = (deptCountMap["FT"] || 0) + 1;
                else if (d.includes("MBA") || d.includes("MCA") || d.includes("MANAGEMENT")) deptCountMap["MGMT"] = (deptCountMap["MGMT"] || 0) + 1;
                else if (d.includes("EEE") || d.includes("ELECTRICAL")) deptCountMap["EEE"] = (deptCountMap["EEE"] || 0) + 1;
                else if (d.includes("ECE") || d.includes("ELECTRONIC")) deptCountMap["ECE"] = (deptCountMap["ECE"] || 0) + 1;
                else if (d.includes("IT") || d.includes("AI") || d.includes("DATA") || d.includes("INFO")) deptCountMap["IT_AIDS"] = (deptCountMap["IT_AIDS"] || 0) + 1;
                else if (d.includes("MECH") || d.includes("SAFETY") || d.includes("FIRE")) deptCountMap["MECH"] = (deptCountMap["MECH"] || 0) + 1;
                else if (d.includes("CIVIL") || d.includes("CIV")) deptCountMap["CIVIL"] = (deptCountMap["CIVIL"] || 0) + 1;
                else if (d.includes("CS") || d.includes("COMP")) deptCountMap["CSE"] = (deptCountMap["CSE"] || 0) + 1;
                else deptCountMap["CSE"] = (deptCountMap["CSE"] || 0) + 1;
            });

            const totalDeptItems = Object.values(deptCountMap).reduce((a, b) => a + b, 0);
            const deptFullNames = {
                "CSE": "Computer Science & Engineering (CSE)",
                "IT_AIDS": "Information Tech & AI/DS (IT & AI-DS)",
                "ECE": "Electronics & Communication (ECE)",
                "EEE": "Electrical & Electronics (EEE)",
                "MECH": "Mechanical & Safety Engg (MECH)",
                "MCT": "Mechatronics Engineering (MCT)",
                "CIVIL": "Civil Engineering (CIVIL)",
                "BME": "Biomedical Engineering (BME)",
                "FT": "Fashion Technology (FT)",
                "MGMT": "Management Studies & MCA (MBA/MCA)"
            };
            const deptColorPalette = {
                "CSE": "#6366f1",
                "IT_AIDS": "#38bdf8",
                "ECE": "#a855f7",
                "EEE": "#eab308",
                "MECH": "#f59e0b",
                "MCT": "#ec4899",
                "CIVIL": "#10b981",
                "BME": "#06b6d4",
                "FT": "#8b5cf6",
                "MGMT": "#64748b"
            };

            const computedDeptStats = Object.entries(deptCountMap).map(([deptCode, count]) => ({
                dept: deptFullNames[deptCode] || `${deptCode} Department`,
                count: count,
                percent: totalDeptItems > 0 ? Math.round((count / totalDeptItems) * 100) : 0,
                color: deptColorPalette[deptCode] || "#6366f1"
            }));

            // DYNAMIC BUDGET & DISBURSEMENT CALCULATION FROM LIVE DATA ONLY
            let liveSanctioned = 0;
            let liveDisbursed = 0;
            let liveVerifiedCount = 0;
            let livePendingCount = 0;

            rawApps.forEach(app => {
                const grantAmt = parseAmount(app.disbursed_amount || app.applied_amount || app.amount || 0);
                liveSanctioned += grantAmt;

                if (["Amount Received", "Disbursed", "Credited"].includes(app.status)) {
                    liveDisbursed += parseAmount(app.disbursed_amount || grantAmt);
                }

                if (["Approved", "Amount Received", "Disbursed"].includes(app.status)) {
                    liveVerifiedCount++;
                } else {
                    livePendingCount++;
                }
            });

            const livePendingRelease = Math.max(0, liveSanctioned - liveDisbursed);
            const livePercent = liveSanctioned > 0 ? Math.round((liveDisbursed / liveSanctioned) * 100) : 0;

            setStats({ pending, applications, scholarships, students, queries });
            setDeptStats(computedDeptStats);
            setBudgetStats({
                totalSanctioned: liveSanctioned,
                totalDisbursed: liveDisbursed,
                verifiedCount: liveVerifiedCount,
                pendingCount: livePendingCount,
                disbursementPercent: livePercent,
                pendingRelease: livePendingRelease
            });
        } catch (e) {
            console.error("Error fetching admin metrics:", e);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* HERO PANEL */}
            <section className="panel" style={{ padding: '28px' }}>
                <span className="badge" style={{ marginBottom: '10px' }}>✦ Admin Command Center</span>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    College <span style={{ color: 'var(--primary)' }}>Admin Portal</span> Management
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', maxWidth: '650px', marginBottom: '18px' }}>
                    Review student document approvals, manage scholarship categories, and monitor AI chatbot analytics in real-time.
                </p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="button primary" onClick={() => router.push('/dashboard/approvals')} style={{ flex: '1 1 auto', minWidth: '150px' }}>
                        Manage Approvals ({stats.pending} Pending)
                    </button>
                    <button className="button" onClick={() => router.push('/dashboard/scholarships')} style={{ flex: '1 1 auto', minWidth: '150px' }}>
                        Scholarships Hub ({stats.scholarships})
                    </button>
                </div>
            </section>

            {/* STATS OVERVIEW */}
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>System Overview</div>
                <div className="grid grid-4">
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>✓</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.pending}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Pending Approvals</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>🎓</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.scholarships}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Active Scholarships</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' }}>👥</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.students}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Enrolled Students</div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' }}>💬</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.queries}</div>
                        <div className="feature-description" style={{ marginTop: '4px' }}>Queries Handled</div>
                    </div>
                </div>
            </div>

            {/* DEPARTMENT APPLICATION DISTRIBUTION & BUDGET TRACKER (LIVE AGGREGATED METRICS) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {/* Department Distribution */}
                <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>🏛️ Department Application Volume</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live distribution across academic departments</div>
                        </div>
                        <span className="badge primary">Live Metrics</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                        {deptStats.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text)' }}>{item.dept}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} Applicants ({item.percent}%)</span>
                                </div>
                                <div style={{ width: '100%', height: '7px', background: 'var(--surface-2)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${item.percent}%`, height: '100%', background: item.color, borderRadius: '10px', transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scholarship Budget Utilization */}
                <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>💰 Grant Sanction & Budget Tracker</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live sanctioned vs disbursed DBT scholarship funds</div>
                        </div>
                        <span className="badge success">Live Data</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                        <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Sanctioned Fund</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                                ₹{budgetStats.totalSanctioned.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '2px' }}>
                                ✓ {budgetStats.verifiedCount} Verified Students
                            </div>
                        </div>
                        <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Directly Disbursed (DBT)</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                                ₹{budgetStats.totalDisbursed.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                                {budgetStats.disbursementPercent}% Completed
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span>Disbursement Progress: <strong>₹{(budgetStats.totalDisbursed / 100000).toFixed(2)}L of ₹{(budgetStats.totalSanctioned / 100000).toFixed(2)}L</strong></span>
                            <span style={{ fontWeight: 800, color: '#10b981' }}>{budgetStats.disbursementPercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'var(--surface-2)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${budgetStats.disbursementPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #38bdf8)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            ⏳ Pending Govt Release: <strong>₹{budgetStats.pendingRelease.toLocaleString('en-IN')}</strong> across {budgetStats.pendingCount} pending applications
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>Quick Admin Actions</div>
                <div className="grid grid-3">
                    <div className="feature-card" onClick={() => router.push('/dashboard/approvals')} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>✓</div>
                        <div className="feature-title">Student Approvals</div>
                        <div className="feature-description">Review uploaded certificates and income declarations.</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Review Now →</div>
                    </div>

                    <div className="feature-card" onClick={() => router.push('/dashboard/scholarships')} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>🎓</div>
                        <div className="feature-title">Scholarship Schemes</div>
                        <div className="feature-description">Update eligibility rules and application links.</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Manage Schemes →</div>
                    </div>

                    <div className="feature-card" onClick={() => router.push('/dashboard/learning')} style={{ cursor: 'pointer' }}>
                        <div className="feature-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c' }}>▤</div>
                        <div className="feature-title">AI Training Data</div>
                        <div className="feature-description">Add new college circulars, exam dates and FAQs.</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Update Data →</div>
                    </div>
                </div>
            </div>

            {/* DISCLAIMER */}
            <div className="disclaimer">
                🛡️ Admin System Active — All Actions Logged & Monitored
            </div>
        </div>
    );
}
