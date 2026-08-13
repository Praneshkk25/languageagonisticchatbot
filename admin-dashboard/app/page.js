"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ShieldCheck, ChevronRight, AlertCircle } from "lucide-react";

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
    }, 800);
  };

  return (
    <main className="login-page-container">
      {/* Background Glow Orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91, 53, 232, 0.35) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[130px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(113, 60, 255, 0.25) 0%, transparent 70%)' }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-card max-w-md"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
            style={{ background: 'rgba(91, 53, 232, 0.16)', borderColor: 'rgba(91, 53, 232, 0.3)', color: '#bcaaff' }}
          >
            <ShieldCheck className="w-7 h-7" />
          </motion.div>

          <h1
            className="text-3xl font-extrabold tracking-tight mb-2 text-white"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Admin Portal
          </h1>
          <p className="text-xs font-medium px-2" style={{ color: 'var(--text-secondary)' }}>
            Secure Access Control & Campus Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 px-1">Username</label>
            <div className="login-input-wrapper">
              <input
                type="text"
                required
                className="login-input"
                placeholder="Enter admin username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <User className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 px-1">Password</label>
            <div className="login-input-wrapper">
              <input
                type="password"
                required
                className="login-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Lock className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2"
                style={{ background: 'rgba(255, 82, 104, 0.12)', borderColor: 'rgba(255, 82, 104, 0.3)', color: '#ff7588' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="login-btn-primary"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border)] text-center">
          <p className="text-[11px] font-medium text-slate-400">Restricted Access Control System</p>
          <p className="text-xs font-bold mt-1 text-purple-400">Authorized Personnel Only</p>
        </div>
      </motion.div>
    </main>
  );
}

