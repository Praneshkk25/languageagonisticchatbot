export default function DashboardHome() {
    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome back, Student</h1>
                <p className="text-text-muted">Here's your academic overview for today.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    label="Pending Fees"
                    value="₹ 0"
                    desc="No dues"
                />
                <StatCard
                    label="Attendance"
                    value="0%"
                    desc="N/A"
                />
                <StatCard
                    label="Assignments"
                    value="0"
                    desc="No pending work"
                />
            </div>

            <div className="content-split">
                {/* Notices */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Latest Notices</h2>
                    <div className="p-6 bg-white border border-border-color rounded-lg text-center text-muted text-sm">
                        No new notices available.
                    </div>
                </div>

                {/* Activity Widget */}
                <div className="card">
                    <h2 className="text-lg font-bold mb-6">Recent Activity</h2>
                    <div className="text-center text-muted text-sm py-4">
                        No recent activity to show.
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, desc }) {
    return (
        <div className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{desc}</div>
        </div>
    );
}

function NoticeCard({ title, date, tag, color }) {
    return (
        <div className="notice-item">
            <div className="flex justify-between items-start mb-2">
                <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: color,
                    backgroundColor: `${color}15`,
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {tag}
                </span>
                <span className="text-xs text-muted">{date}</span>
            </div>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>{title}</h3>
        </div>
    );
}
