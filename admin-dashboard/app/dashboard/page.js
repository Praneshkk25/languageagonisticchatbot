export default function AdminDashboard() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Sona College Admin</h1>
                <p className="text-muted">Overview of Sona Campus Departments & Student Activities.</p>
            </div>

            <div className="flex gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <StatCard label="Total Students" value="4,500+" desc="Across all depts" />
                <StatCard label="Admissions (2026)" value="850" desc="Applications received" />
                <StatCard label="Placements" value="92%" desc="Placement Rate" color="var(--success)" />
                <StatCard label="Research Papers" value="120+" desc="Published this year" color="var(--primary)" />
            </div>

            <div className="flex gap-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="card" style={{ minHeight: '300px' }}>
                    <h3 className="font-bold mb-4 text-lg">Query Volume (7d)</h3>
                    <div className="flex items-center justify-center h-64 text-muted bg-slate-50 rounded border border-slate-100">
                        [Chart Area Placeholder]
                    </div>
                </div>
                <div className="card" style={{ minHeight: '300px' }}>
                    <h3 className="font-bold mb-4 text-lg">Intent Distribution</h3>
                    <div className="flex items-center justify-center h-64 text-muted bg-slate-50 rounded border border-slate-100">
                        [Chart Area Placeholder]
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, desc, color = "#0f172a" }) {
    return (
        <div className="card" style={{ marginBottom: 0 }}>
            <div className="text-sm text-muted mb-2 font-medium uppercase tracking-wider">{label}</div>
            <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs text-muted">{desc}</div>
        </div>
    );
}
