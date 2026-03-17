"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Calendar, ArrowRight, Sparkles } from "lucide-react";

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
    <main className="login-container relative overflow-hidden flex items-center justify-center min-h-screen p-4">
      {/* Dynamic Background */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] pointer-events-none"
        style={{ backgroundColor: 'var(--primary-glow)' }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="login-card-wrapper glass p-8 md:p-12 w-full max-w-lg relative z-10"
      >
        <div className="login-header mb-10 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6"
          >
            <Sparkles className="w-3 h-3" />
            <span>Official Student Portal</span>
          </motion.div>
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            Campus Connect
          </h1>
          <p className="text-muted font-medium">Welcome back, Student!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 px-1">Admission Number</label>
            <div className="relative group">
              <input
                type="text"
                required
                className="input-field w-full pl-5 pr-12 h-14"
                placeholder="e.g. 2023CS001"
                value={formData.admissionNo}
                onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
              />
              <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 px-1">Date of Birth</label>
            <div className="relative group">
              <input
                type="date"
                required
                className="input-field w-full pl-5 pr-12 h-14"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-14 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Having trouble? <a href="#" className="text-primary font-bold hover:underline">Contact Student Support</a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
