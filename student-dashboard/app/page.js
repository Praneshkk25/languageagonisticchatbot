"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ admissionNo: "", dob: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock Validation
    setTimeout(() => {
      if (formData.admissionNo && formData.dob) {
        router.push("/dashboard");
      } else {
        setError("Please check your credentials.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="login-container">
      <div className="login-card-wrapper">
        <div className="login-header mb-8">
          <h1>Campus Connect</h1>
          <p className="text-center text-muted">Student Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#475569' }}>
              Admission Number
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. 2023CS001"
              value={formData.admissionNo}
              onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#475569' }}>
              Date of Birth
            </label>
            <input
              type="date"
              required
              className="input-field"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
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
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: '#94a3b8' }}>
          Having trouble? <a href="#" style={{ color: 'var(--primary)', fontWeight: 500 }}>Contact Support</a>
        </div>
      </div>
    </main>
  );
}
