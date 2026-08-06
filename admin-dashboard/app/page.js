"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ShieldCheck, ChevronRight } from "lucide-react";

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
    <main className="login-container relative overflow-hidden flex items-center justify-center min-h-screen">
      {/* Aurora Background Orbs */}
      <div className="absolute top-[-12%] right-[-8%] w-[45%] h-[45%] rounded-full blur-[120px] pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.32) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-12%] left-[-8%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.22) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full blur-[100px] pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 70%)' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="login-card-wrapper glass p-10 w-full max-w-md relative z-10"
      >
        <div className="login-header mb-10 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(245,158,11,0.12) 100%)', border: '1px solid rgba(20,184,166,0.22)' }}
          >
            <ShieldCheck className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </motion.div>
          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', backgroundImage: 'linear-gradient(135deg, #14b8a6 0%, #f43f5e 55%, #f59e0b 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}
          >
            Admin Portal
          </h1>
          <p className="text-sm px-4" style={{ color: 'var(--text-muted)' }}>Secure access control for Sona Campus Management</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2 flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1 mb-2">
              Username
            </label>
            <div className="relative group flex">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                required
                className="input-field w-full pl-12"
                placeholder="admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1 mb-2">
              Password
            </label>
            <div className="relative group flex">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                required
                className="input-field w-full pl-12"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium text-center border border-red-100"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? "Authenticating..." : "Login to Dashboard"}
              {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center text-xs space-y-2">
          <p className="text-muted">Restricted Area</p>
          <p className="font-semibold text-primary" style={{ color: 'var(--primary)' }}>Authorized Personnel Only</p>
        </div>
      </motion.div>
    </main>
  );
}
