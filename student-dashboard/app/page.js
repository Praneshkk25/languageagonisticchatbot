"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Calendar, Lock, Key, ShieldCheck, ArrowRight, Sparkles, 
  AlertCircle, CheckCircle2, UserCheck, Phone, RefreshCw, X, HelpCircle, KeyRound 
} from "lucide-react";

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

  // Forgot Password Modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({
    admissionNo: "2023CS001",
    mobileNo: "9876543210",
    otp: "",
    newPassword: "",
    passkey1: "123456",
    passkey2: "654321"
  });
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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
          setFirstTimeUser(data.user);
          setSetupError("");
          setSetupModalOpen(true);
        } else {
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

  const handleSendOtp = () => {
    if (!forgotData.mobileNo || forgotData.mobileNo.length < 10) {
      setForgotError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setForgotError("");
    setOtpSent(true);
    setForgotData(prev => ({ ...prev, otp: "123456" }));
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (forgotStep === 1) {
      if (!otpSent || !forgotData.otp) {
        setForgotError("Please request and enter the Mobile OTP code.");
        return;
      }
      setForgotStep(2);
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: forgotData.admissionNo.trim() || formData.admissionNo.trim(),
          mobile_no: forgotData.mobileNo.trim(),
          otp: forgotData.otp.trim() || "123456",
          new_password: forgotData.newPassword,
          passkey_1: forgotData.passkey1,
          passkey_2: forgotData.passkey2
        })
      });

      const data = await res.json();

      if (res.ok) {
        setForgotSuccess("Password & Passkeys reset successfully! Redirecting...");
        setTimeout(() => {
          setForgotModalOpen(false);
          setForgotStep(1);
          setOtpSent(false);
          checkStudentStatus(formData.admissionNo.trim());
          setLoginMode("custom");
        }, 1200);
      } else {
        setForgotError(data.detail || "Failed to reset password.");
      }
    } catch (e) {
      setForgotError("Error connecting to password reset service.");
    } finally {
      setForgotLoading(false);
    }
  };

  const isReturningStudent = studentStatus?.exists && studentStatus?.has_custom_password;

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
        className="login-card max-w-lg"
      >
        <div className="text-center">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-3 border"
            style={{
              background: 'rgba(91, 53, 232, 0.14)',
              color: '#bcaaff',
              borderColor: 'rgba(91, 53, 232, 0.3)'
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Campus Connect Student Portal</span>
          </motion.div>
          
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Student Sign In
          </h1>
          <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isReturningStudent 
              ? "Returning Student: Log in using your Custom Password & Double Passkeys"
              : "First-Time Login: Authenticate with DOB to configure custom credentials"}
          </p>
        </div>

        {/* Status Indicator & Mode Rules */}
        {isReturningStudent ? (
          <div className="p-3.5 rounded-xl text-xs font-bold border flex items-center justify-between shadow-sm"
               style={{ background: 'rgba(91, 53, 232, 0.15)', borderColor: 'rgba(91, 53, 232, 0.35)', color: '#ffffff' }}>
            <span className="flex items-center gap-2.5 min-w-0 pr-2">
              <ShieldCheck className="w-4.5 h-4.5 text-purple-400 shrink-0" />
              <span className="truncate">Account Configured for <strong>{studentStatus.name}</strong></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Custom Password Active
            </span>
          </div>
        ) : (
          <div className="login-tab-container">
            <button
              type="button"
              className="login-tab active"
            >
              <Calendar className="w-4 h-4 text-purple-300" />
              <span>First-Time Setup (DOB)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
          {/* Admission Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 px-1">Admission Number</label>
            <div className="login-input-wrapper">
              <input
                type="text"
                required
                className="login-input"
                placeholder="e.g. 2023CS001"
                value={formData.admissionNo}
                onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
              />
              <GraduationCap className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* First-Time Login (DOB) */}
          {!isReturningStudent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 px-1">Date of Birth (DOB)</label>
              <div className="login-input-wrapper">
                <input
                  type="date"
                  required
                  className="login-input"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
                <Calendar className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-[11px] font-semibold mt-1 p-3 rounded-xl border flex items-center gap-2"
                 style={{ background: 'rgba(91, 53, 232, 0.12)', borderColor: 'rgba(91, 53, 232, 0.25)', color: '#c2b5ff' }}>
                <span>💡 Log in with DOB for your 1st time to set your Custom Password & Double Passkeys!</span>
              </p>
            </motion.div>
          )}

          {/* Returning Student (Custom Password + Double Passkeys) */}
          {isReturningStudent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-slate-300">Your Custom Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotData(prev => ({ ...prev, admissionNo: formData.admissionNo }));
                      setForgotError("");
                      setForgotSuccess("");
                      setForgotStep(1);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
                <div className="login-input-wrapper">
                  <input
                    type="password"
                    required
                    className="login-input"
                    placeholder="Enter your custom password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Lock className="absolute right-4 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">🔑 Passkey 1</label>
                  <input
                    type="password"
                    required
                    className="login-input font-mono !pl-3.5"
                    placeholder="Passkey 1"
                    value={formData.passkey1}
                    onChange={(e) => setFormData({ ...formData, passkey1: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">🔐 Passkey 2</label>
                  <input
                    type="password"
                    required
                    className="login-input font-mono !pl-3.5"
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
                <span>{isReturningStudent ? "Sign In to Dashboard" : "Verify DOB & Access Setup"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border)] text-center flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Need assistance? <a href="#" className="text-purple-400 font-bold hover:underline">Contact Student Support</a>
          </p>
          {isReturningStudent && (
            <button
              type="button"
              onClick={() => {
                setForgotData(prev => ({ ...prev, admissionNo: formData.admissionNo }));
                setForgotError("");
                setForgotSuccess("");
                setForgotStep(1);
                setForgotModalOpen(true);
              }}
              className="text-xs font-bold text-purple-400 hover:underline"
            >
              Reset Password
            </button>
          )}
        </div>
      </motion.div>

      {/* FIRST-TIME LOGIN CREDENTIALS SETUP MODAL */}
      <AnimatePresence>
        {setupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] p-7 shadow-2xl border space-y-5 relative overflow-hidden"
              style={{ background: '#091329', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#bcaaff' }}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">First-Time Setup Required</h3>
                    <p className="text-[11px] font-semibold text-slate-400">Configure Custom Password & Passkeys</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl space-y-1 border"
                   style={{ background: 'rgba(91, 53, 232, 0.12)', borderColor: 'rgba(91, 53, 232, 0.25)' }}>
                <p className="text-xs font-bold text-white">
                  🎉 Welcome, <strong>{firstTimeUser?.name || "Student"}</strong>!
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your DOB verification succeeded. Set up your custom password and 2-Factor Double Passkeys to use for all future logins.
                </p>
              </div>

              {setupError && (
                <div className="p-3 rounded-xl text-xs font-bold border flex items-center gap-2"
                     style={{ background: 'rgba(255, 82, 104, 0.12)', borderColor: 'rgba(255, 82, 104, 0.3)', color: '#ff7588' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    🔑 Create Your Custom Password
                  </label>
                  <input 
                    type="password"
                    required
                    className="login-input !pl-3.5"
                    placeholder="Enter new password (min 4 chars)"
                    value={setupData.newPassword}
                    onChange={(e) => setSetupData({ ...setupData, newPassword: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    🔑 Passkey 1 (Primary Account Key)
                  </label>
                  <input 
                    type="password"
                    required
                    className="login-input font-mono !pl-3.5"
                    placeholder="Enter Passkey 1 (e.g. 123456)"
                    value={setupData.passkey1}
                    onChange={(e) => setSetupData({ ...setupData, passkey1: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    🔐 Passkey 2 (Cloud Vault Key)
                  </label>
                  <input 
                    type="password"
                    required
                    className="login-input font-mono !pl-3.5"
                    placeholder="Enter Passkey 2 (e.g. 654321)"
                    value={setupData.passkey2}
                    onChange={(e) => setSetupData({ ...setupData, passkey2: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="login-btn-primary mt-2"
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

      {/* FORGOT PASSWORD (MOBILE OTP VERIFICATION) MODAL */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] p-7 shadow-2xl border space-y-5 relative overflow-hidden"
              style={{ background: '#091329', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(91, 53, 232, 0.2)', color: '#bcaaff' }}>
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Reset Password & Passkeys</h3>
                    <p className="text-[11px] font-semibold text-slate-400">Mobile Verification & Security Recovery</p>
                  </div>
                </div>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotError && (
                <div className="p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2"
                     style={{ background: 'rgba(255, 82, 104, 0.12)', borderColor: 'rgba(255, 82, 104, 0.3)', color: '#ff7588' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3.5 rounded-xl text-xs font-bold border flex items-center gap-2"
                     style={{ background: 'rgba(66, 214, 164, 0.12)', borderColor: 'rgba(66, 214, 164, 0.3)', color: 'var(--success)' }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotStep === 1 ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Admission Number</label>
                      <input 
                        type="text"
                        required
                        className="login-input !pl-3.5"
                        placeholder="e.g. 2023CS001"
                        value={forgotData.admissionNo}
                        onChange={(e) => setForgotData({ ...forgotData, admissionNo: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Registered Mobile Number</label>
                      <div className="login-input-wrapper">
                        <input 
                          type="tel"
                          required
                          className="login-input"
                          placeholder="Enter 10-digit mobile number"
                          value={forgotData.mobileNo}
                          onChange={(e) => setForgotData({ ...forgotData, mobileNo: e.target.value })}
                        />
                        <Phone className="absolute right-4 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">6-Digit Mobile OTP</label>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{otpSent ? "Resend OTP" : "Send Demo OTP"}</span>
                        </button>
                      </div>
                      <input 
                        type="text"
                        required
                        className="login-input font-mono !pl-3.5 tracking-widest text-center text-base"
                        placeholder="123456"
                        maxLength={6}
                        value={forgotData.otp}
                        onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                      />
                    </div>

                    {otpSent && (
                      <p className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                        ✅ OTP sent to {forgotData.mobileNo}. Use code <strong>123456</strong> to verify.
                      </p>
                    )}

                    <button
                      type="submit"
                      className="login-btn-primary mt-2"
                    >
                      <span>Verify Mobile OTP & Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-200">
                      📱 Mobile verified for {forgotData.admissionNo}! Now create your new password and passkeys.
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">🔑 New Custom Password</label>
                      <input 
                        type="password"
                        required
                        className="login-input !pl-3.5"
                        placeholder="Enter new password (min 4 chars)"
                        value={forgotData.newPassword}
                        onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-300">🔑 Passkey 1</label>
                        <input 
                          type="password"
                          required
                          className="login-input font-mono !pl-3.5"
                          placeholder="Passkey 1"
                          value={forgotData.passkey1}
                          onChange={(e) => setForgotData({ ...forgotData, passkey1: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-300">🔐 Passkey 2</label>
                        <input 
                          type="password"
                          required
                          className="login-input font-mono !pl-3.5"
                          placeholder="Passkey 2"
                          value={forgotData.passkey2}
                          onChange={(e) => setForgotData({ ...forgotData, passkey2: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="login-btn-primary mt-2"
                    >
                      {forgotLoading ? (
                        <span>Updating Credentials...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Reset Credentials & Save</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}


