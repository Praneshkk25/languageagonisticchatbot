"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Calendar, Lock, Key, ShieldCheck, ArrowRight, Sparkles, AlertCircle, CheckCircle2, UserCheck, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState("first_time"); // "first_time" or "custom"
  const [formData, setFormData] = useState({
    admissionNo: "2023CS001",
    dob: "2000-01-01",
    password: "",
    passkey1: "123456",
    passkey2: "654321"
  });
  const [studentStatus, setStudentStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Setup Modal for First Time Login
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [firstTimeUser, setFirstTimeUser] = useState(null);
  const [setupData, setSetupData] = useState({
    newPassword: "",
    passkey1: "123456",
    passkey2: "654321"
  });
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Auto-detect student status when admissionNo changes
  useEffect(() => {
    if (formData.admissionNo.trim().length >= 4) {
      checkStudentStatus(formData.admissionNo.trim());
    }
  }, [formData.admissionNo]);

  const checkStudentStatus = async (admNo) => {
    try {
      const res = await fetch(`http://localhost:8000/api/auth/student-status/${admNo}`);
      if (res.ok) {
        const data = await res.json();
        setStudentStatus(data);
        if (data.exists && data.has_custom_password) {
          setLoginMode("custom");
        } else if (data.exists && !data.has_custom_password) {
          setLoginMode("first_time");
        }
      }
    } catch (e) {
      // Silent catch
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        admission_no: formData.admissionNo.trim(),
        login_type: loginMode,
        dob: formData.dob,
        password: formData.password,
        passkey_1: formData.passkey1,
        passkey_2: formData.passkey2
      };

      const res = await fetch("http://localhost:8000/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.is_first_login) {
          // Open setup modal to set custom password and double passkeys
          setFirstTimeUser(data.user);
          setSetupError("");
          setSetupModalOpen(true);
        } else {
          // Normal returning student login
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push("/dashboard");
        }
      } else {
        setError(data.detail || "Authentication failed. Please verify your credentials.");
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError("");
    setSetupLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/setup-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: firstTimeUser.id || formData.admissionNo.trim(),
          dob: firstTimeUser.dob || formData.dob,
          new_password: setupData.newPassword,
          passkey_1: setupData.passkey1,
          passkey_2: setupData.passkey2
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSetupModalOpen(false);
        localStorage.setItem("user", JSON.stringify(data.user || firstTimeUser));
        router.push("/dashboard");
      } else {
        setSetupError(data.detail || "Failed to set up credentials.");
      }
    } catch (e) {
      setSetupError("Error saving security credentials to cloud database.");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <main className="login-container relative overflow-hidden flex items-center justify-center min-h-screen p-4">
      {/* Background Orbs */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.70, 0.45] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] right-[-8%] w-[55%] h-[55%] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.38) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.14, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-15%] left-[-8%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.28) 0%, transparent 70%)' }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="login-card-wrapper glass p-8 md:p-10 w-full max-w-lg relative z-10 my-8"
      >
        <div className="login-header mb-8 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(245,158,11,0.10) 100%)',
              color: 'var(--primary)',
              border: '1px solid rgba(20,184,166,0.22)'
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Connect Student Portal</span>
          </motion.div>
          
          <h1
            className="text-4xl font-black tracking-tight mb-2 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #14b8a6 0%, #f43f5e 55%, #f59e0b 100%)', fontFamily: 'var(--font-display)' }}
          >
            Student Sign In
          </h1>
          <p className="text-muted font-medium text-xs">
            {loginMode === "first_time" 
              ? "First-Time Login: Authenticate with Date of Birth to set up your password & Double Passkeys"
              : "Returning Student: Log in using your Custom Password & Double Passkeys"}
          </p>
        </div>

        {/* Login Mode Selector Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 gap-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setLoginMode("first_time")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === "first_time"
                ? "bg-white text-teal-700 shadow-md border border-teal-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1st Time (DOB)</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("custom")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === "custom"
                ? "bg-teal-600 text-white shadow-md border border-teal-500"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Password & Passkeys</span>
          </button>
        </div>

        {studentStatus?.exists && (
          <div className={`mb-6 p-3 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            studentStatus.has_custom_password 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}>
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>{studentStatus.name} ({formData.admissionNo})</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md bg-white/60">
              {studentStatus.has_custom_password ? "Custom Password Set" : "First-Time DOB"}
            </span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
          {/* Admission Number */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-extrabold text-slate-700 px-1">Admission Number</label>
            <div className="relative group flex">
              <input
                type="text"
                required
                className="input-field w-full pl-5 pr-12 h-13 text-sm font-bold"
                placeholder="e.g. 2023CS001"
                value={formData.admissionNo}
                onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
              />
              <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          {/* Mode 1: First-Time Login (DOB) */}
          {loginMode === "first_time" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5 flex flex-col">
              <label className="text-xs font-extrabold text-slate-700 px-1">Date of Birth (DOB)</label>
              <div className="relative group flex">
                <input
                  type="date"
                  required
                  className="input-field w-full pl-5 pr-12 h-13 text-sm font-bold"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <p className="text-[11px] text-teal-700 font-semibold mt-1 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                💡 Log in with DOB for your 1st time to set your Custom Password & Double Passkeys!
              </p>
            </motion.div>
          )}

          {/* Mode 2: Returning Student (Custom Password + Double Passkeys) */}
          {loginMode === "custom" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-extrabold text-slate-700 px-1">Your Custom Password</label>
                <div className="relative group flex">
                  <input
                    type="password"
                    required
                    className="input-field w-full pl-5 pr-12 h-13 text-sm font-bold"
                    placeholder="Enter your custom password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">🔑 Passkey 1</label>
                  <input
                    type="password"
                    required
                    className="input-field w-full px-3 h-11 text-xs font-mono font-bold"
                    placeholder="Passkey 1"
                    value={formData.passkey1}
                    onChange={(e) => setFormData({ ...formData, passkey1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">🔐 Passkey 2</label>
                  <input
                    type="password"
                    required
                    className="input-field w-full px-3 h-11 text-xs font-mono font-bold"
                    placeholder="Passkey 2"
                    value={formData.passkey2}
                    onChange={(e) => setFormData({ ...formData, passkey2: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-13 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{loginMode === "first_time" ? "Verify DOB & Set Credentials" : "Sign In with Passkeys"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Need help? <a href="#" className="text-teal-600 font-extrabold hover:underline">Contact Student Support</a>
          </p>
        </div>
      </motion.div>

      {/* FIRST-TIME LOGIN CREDENTIALS SETUP MODAL */}
      <AnimatePresence>
        {setupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-display">First-Time Setup Required</h3>
                    <p className="text-[11px] font-bold text-slate-400">Set Custom Password & Double Passkeys</p>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-teal-900">
                  🎉 Welcome, <strong>{firstTimeUser?.name || "Student"}</strong>!
                </p>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Your DOB verification succeeded. Set up your custom password and 2-Factor Double Passkeys to use for all future logins.
                </p>
              </div>

              {setupError && (
                <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    🔑 Create Your Custom Password
                  </label>
                  <input 
                    type="password"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/20"
                    placeholder="Enter new password (min 4 chars)"
                    value={setupData.newPassword}
                    onChange={(e) => setSetupData({ ...setupData, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    🔑 Passkey 1 (Primary Account Key)
                  </label>
                  <input 
                    type="password"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-teal-500/20"
                    placeholder="Enter Passkey 1 (e.g. 123456)"
                    value={setupData.passkey1}
                    onChange={(e) => setSetupData({ ...setupData, passkey1: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">
                    🔐 Passkey 2 (Cloud Vault Key)
                  </label>
                  <input 
                    type="password"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-teal-500/20"
                    placeholder="Enter Passkey 2 (e.g. 654321)"
                    value={setupData.passkey2}
                    onChange={(e) => setSetupData({ ...setupData, passkey2: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2 mt-2"
                >
                  {setupLoading ? (
                    <span>Saving Credentials...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Save Credentials & Access Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
