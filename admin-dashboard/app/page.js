"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import "./globals.css"; // Next.js usually handles this at layout level, but ensuring it's loaded

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock Validation
    setTimeout(() => {
      if (formData.username === "admin" && formData.password === "admin") {
        router.push("/dashboard");
      } else {
        setError("Invalid Credentials (Try admin/admin)");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="login-container">
      <div className="login-card-wrapper">
        <div className="login-header mb-8">
          <h1>Admin Portal</h1>
          <p className="text-center text-muted">Secure Access Control</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#475569' }}>
              Username
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="admin"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#475569' }}>
              Password
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 text-red-600 text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: '#94a3b8' }}>
          Restricted Area <span style={{ color: 'var(--primary)', fontWeight: 500 }}>System Admins Only</span>
        </div>
      </div>
    </main>
  );
}
