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
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" 
           style={{ backgroundColor: 'var(--primary-glow)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
           style={{ backgroundColor: 'var(--primary-glow)' }} />

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
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--primary-glow)' }}
          >
            <ShieldCheck className="w-8 h-8 text-primary" style={{ color: 'var(--primary)' }} />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Portal</h1>
          <p className="text-muted text-sm px-4">Secure access control for Sona Campus Management</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
              Username
            </label>
            <div className="relative group">
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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
              Password
            </label>
            <div className="relative group">
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
            <motion.div 
              className="absolute inset-0 bg-white/10"
              initial={false}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
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
