"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Calendar, Lock, ShieldCheck, ArrowRight, Sparkles, 
  AlertCircle, CheckCircle2, Phone, RefreshCw, X, KeyRound, Eye, EyeOff 
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getApiBaseUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState("first_time"); // "first_time" or "custom"
  const [formData, setFormData] = useState({
    admissionNo: "23CSEBE274",
    dob: "2005-08-26",
    password: "",
    passkey1: "123456",
    passkey2: "654321"
  });
  const [showPassword, setShowPassword] = useState(false);
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
    admissionNo: "",
    mobileNo: "",
    otp: "123456",
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
    const clean = formData.admissionNo.trim().toUpperCase();
    if (clean.length >= 3) {
      const timer = setTimeout(() => {
        checkStudentStatus(clean);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setStudentStatus(null);
      setLoginMode("first_time");
    }
  }, [formData.admissionNo]);

  const checkStudentStatus = async (admNo) => {
    if (!admNo) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/student-status/${encodeURIComponent(admNo)}`);
      if (res.ok) {
        const data = await res.json();
        setStudentStatus(data);
        if (data.exists && data.has_custom_password) {
          setLoginMode("custom");
          setError("");
        } else if (data.exists && !data.has_custom_password) {
          setLoginMode("first_time");
          setError("");
        }
      }
    } catch (e) {
      // Safe fallback when backend is unreachable
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanAdmNo = formData.admissionNo.trim().toUpperCase();
    const effectiveMode = (studentStatus?.exists && studentStatus?.has_custom_password) ? "custom" : loginMode;

    try {
      const payload = {
        admission_no: cleanAdmNo,
        login_type: effectiveMode,
        dob: formData.dob,
        password: formData.password,
        passkey_1: formData.passkey1,
        passkey_2: formData.passkey2
      };

      const res = await fetch(`${getApiBaseUrl()}/api/auth/student`, {
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
        if (data.detail && data.detail.includes("Account already configured")) {
          setLoginMode("custom");
          checkStudentStatus(cleanAdmNo);
        }
        setError(data.detail || "Authentication failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to the authentication server. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError("");

    if (setupData.newPassword.length < 4) {
      setSetupError("Password must be at least 4 characters.");
      return;
    }
    if (!setupData.passkey1 || !setupData.passkey2) {
      setSetupError("Please specify both 6-digit Double Passkeys.");
      return;
    }

    setSetupLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/student/setup-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: firstTimeUser?.admission_no || formData.admissionNo.trim().toUpperCase(),
          password: setupData.newPassword,
          passkey_1: setupData.passkey1,
          passkey_2: setupData.passkey2
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setSetupModalOpen(false);
        router.push("/dashboard");
      } else {
        setSetupError(data.detail || "Failed to save security credentials.");
      }
    } catch (err) {
      setSetupError("Network connection error. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!forgotData.admissionNo) {
      setForgotError("Please enter your Admission / Roll Number first.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: forgotData.admissionNo.trim().toUpperCase(),
          mobile_no: forgotData.mobileNo,
          email: forgotData.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setForgotSuccess(data.message || `✓ 6-Digit OTP sent to ${data.email || "registered email"}`);
        if (data.demo_otp && !forgotData.otp) {
          setForgotData(prev => ({ ...prev, otp: data.demo_otp }));
        }
      } else {
        setForgotError(data.detail || "Could not send OTP.");
      }
    } catch (err) {
      setOtpSent(true);
      setForgotSuccess("✓ Verification OTP initialized: Check your email inbox or backend log.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (forgotStep === 1) {
      if (!forgotData.otp || forgotData.otp.length !== 6) {
        setForgotError("Please enter the 6-digit OTP.");
        return;
      }
      setForgotStep(2);
      return;
    }

    if (forgotData.newPassword.length < 4) {
      setForgotError("New password must be at least 4 characters.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: forgotData.admissionNo.trim().toUpperCase(),
          mobile_no: forgotData.mobileNo,
          otp: forgotData.otp,
          new_password: forgotData.newPassword,
          passkey_1: forgotData.passkey1,
          passkey_2: forgotData.passkey2
        })
      });

      const data = await res.json();
      if (res.ok) {
        setForgotSuccess("✓ Security credentials reset successfully! You can now sign in.");
        setTimeout(() => {
          setForgotModalOpen(false);
          setLoginMode("custom");
          setFormData(prev => ({
            ...prev,
            admissionNo: forgotData.admissionNo.toUpperCase(),
            password: forgotData.newPassword,
            passkey1: forgotData.passkey1,
            passkey2: forgotData.passkey2
          }));
        }, 1500);
      } else {
        setForgotError(data.detail || "Password reset failed.");
      }
    } catch (err) {
      setForgotError("Network error resetting password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const isReturningStudent = studentStatus?.has_custom_password;

  return (
    <main style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 15%, rgba(91, 53, 232, 0.22), transparent 55%), radial-gradient(circle at 80% 85%, rgba(113, 60, 255, 0.16), transparent 45%), var(--bg)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px'
    }}>
      {/* Top Bar with Theme Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeToggle />
      </div>

      {/* Ambient background glow orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '50vw',
        height: '50vw',
        maxWidth: '500px',
        maxHeight: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91, 53, 232, 0.28) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '45vw',
        height: '45vw',
        maxWidth: '450px',
        maxHeight: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Student Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--card-bg, rgba(12, 23, 48, 0.95))',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.5)), 0 0 35px rgba(91, 53, 232, 0.16)',
          backdropFilter: 'blur(20px)',
          padding: '32px 24px',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header Section */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#ffffff',
              border: '2px solid rgba(91, 53, 232, 0.3)',
              padding: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}
          >
            <img 
              src="/logo.webp" 
              alt="Sona College Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </motion.div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(91, 53, 232, 0.14)',
            border: '1px solid rgba(91, 53, 232, 0.3)',
            color: 'var(--primary)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            <Sparkles style={{ width: '13px', height: '13px' }} />
            <span>Sona College Student Portal</span>
          </div>

          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            marginBottom: '4px'
          }}>
            Student Sign In
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            maxWidth: '360px'
          }}>
            {isReturningStudent 
              ? "Returning Student: Log in using your Custom Password & Passkeys"
              : "First-Time Login: Authenticate with DOB to configure custom credentials"}
          </p>
        </div>

        {/* Student Status Detected Pill */}
        {studentStatus?.exists && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'rgba(91, 53, 232, 0.12)',
            border: '1px solid rgba(91, 53, 232, 0.3)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <ShieldCheck style={{ width: '15px', height: '15px', color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Student: <strong>{studentStatus.name}</strong> ({studentStatus.department})
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: studentStatus.has_custom_password ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: studentStatus.has_custom_password ? '#10b981' : '#f59e0b',
              border: `1px solid ${studentStatus.has_custom_password ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
            }}>
              {studentStatus.has_custom_password ? "Custom Login" : "DOB Setup"}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Admission Number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: '2px' }}>
              Admission / Roll Number
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                required
                placeholder="Enter Roll Number (e.g. 23CSEBE274)"
                value={formData.admissionNo}
                onChange={(e) => {
                  setFormData({ ...formData, admissionNo: e.target.value.toUpperCase() });
                  setError("");
                }}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text)',
                  paddingLeft: '14px',
                  paddingRight: '42px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              <GraduationCap style={{
                position: 'absolute',
                right: '14px',
                width: '18px',
                height: '18px',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }} />
            </div>
          </div>

          {/* First Time Login: DOB Field */}
          {loginMode === "first_time" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: '2px' }}>
                Date of Birth (DOB)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text)',
                    paddingLeft: '14px',
                    paddingRight: '42px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <Calendar style={{
                  position: 'absolute',
                  right: '14px',
                  width: '18px',
                  height: '18px',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }} />
              </div>
              <p style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'rgba(91, 53, 232, 0.1)',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(91, 53, 232, 0.25)',
                marginTop: '4px',
                lineHeight: 1.4
              }}>
                💡 Authenticate with your official Date of Birth to access your student profile.
              </p>
            </motion.div>
          )}

          {/* Returning Student: Custom Password & Passkeys */}
          {loginMode === "custom" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Custom Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: '2px' }}>
                    Custom Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your custom password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text)',
                      paddingLeft: '14px',
                      paddingRight: '42px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                  <Lock style={{
                    position: 'absolute',
                    right: '14px',
                    width: '18px',
                    height: '18px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {/* Passkeys Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>🔑 Passkey 1</label>
                  <input
                    type="password"
                    required
                    placeholder="Passkey 1"
                    value={formData.passkey1}
                    onChange={(e) => setFormData({ ...formData, passkey1: e.target.value })}
                    style={{
                      width: '100%',
                      height: '44px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>🔐 Passkey 2</label>
                  <input
                    type="password"
                    required
                    placeholder="Passkey 2"
                    value={formData.passkey2}
                    onChange={(e) => setFormData({ ...formData, passkey2: e.target.value })}
                    style={{
                      width: '100%',
                      height: '44px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle style={{ width: '16px', height: '16px', shrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>



          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(135deg, #5b35e8, #713cff)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(91, 53, 232, 0.35)',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{loginMode === "custom" ? "Sign In to Dashboard" : "Authenticate & Access Portal"}</span>
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </>
            )}
          </button>
        </form>

        {/* Footer & Reset Password Trigger */}
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <p style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Need assistance? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Student Cell</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setForgotData(prev => ({ ...prev, admissionNo: formData.admissionNo }));
              setForgotError("");
              setForgotSuccess("");
              setForgotStep(1);
              setForgotModalOpen(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Forgot Password?
          </button>
        </div>
      </motion.div>

      {/* FIRST-TIME CREDENTIAL SETUP MODAL */}
      <AnimatePresence>
        {setupModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'var(--card-bg, #091329)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(91, 53, 232, 0.2)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>First-Time Setup Required</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Configure Custom Password & Double Passkeys</p>
                </div>
              </div>

              <div style={{
                background: 'rgba(91, 53, 232, 0.12)',
                border: '1px solid rgba(91, 53, 232, 0.25)',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'var(--text)',
                lineHeight: 1.5
              }}>
                🎉 Welcome, <strong>{firstTimeUser?.name || "Student"}</strong>!<br />
                Your DOB verification succeeded. Set up your custom password and 2-Factor Passkeys for all future logins.
              </div>

              {setupError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444'
                }}>
                  {setupError}
                </div>
              )}

              <form onSubmit={handleSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    🔑 Create Your Custom Password
                  </label>
                  <input 
                    type="password"
                    required
                    placeholder="Enter new password (min 4 chars)"
                    value={setupData.newPassword}
                    onChange={(e) => setSetupData({ ...setupData, newPassword: e.target.value })}
                    style={{
                      width: '100%',
                      height: '46px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    🔑 Passkey 1 (Primary Account Key)
                  </label>
                  <input 
                    type="password"
                    required
                    placeholder="Enter Passkey 1 (e.g. 123456)"
                    value={setupData.passkey1}
                    onChange={(e) => setSetupData({ ...setupData, passkey1: e.target.value })}
                    style={{
                      width: '100%',
                      height: '46px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    🔐 Passkey 2 (Cloud Vault Key)
                  </label>
                  <input 
                    type="password"
                    required
                    placeholder="Enter Passkey 2 (e.g. 654321)"
                    value={setupData.passkey2}
                    onChange={(e) => setSetupData({ ...setupData, passkey2: e.target.value })}
                    style={{
                      width: '100%',
                      height: '46px',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={setupLoading}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: setupLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '6px'
                  }}
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  <span>{setupLoading ? "Saving Credentials..." : "Save Credentials & Open Dashboard"}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'var(--card-bg, #091329)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(91, 53, 232, 0.2)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <KeyRound style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>Reset Password & Passkeys</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email OTP Security Recovery</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              {forgotError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444'
                }}>
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981'
                }}>
                  {forgotSuccess}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {forgotStep === 1 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Admission Number</label>
                      <input 
                        type="text"
                        required
                        placeholder="Enter Roll Number"
                        value={forgotData.admissionNo}
                        onChange={(e) => setForgotData({ ...forgotData, admissionNo: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%',
                          height: '46px',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text)',
                          padding: '0 12px',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Registered Mobile Number (Optional)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="tel"
                          placeholder="Enter 10-digit mobile number"
                          value={forgotData.mobileNo}
                          onChange={(e) => setForgotData({ ...forgotData, mobileNo: e.target.value })}
                          style={{
                            width: '100%',
                            height: '46px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            color: 'var(--text)',
                            paddingLeft: '12px',
                            paddingRight: '36px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        <Phone style={{
                          position: 'absolute',
                          right: '12px',
                          width: '16px',
                          height: '16px',
                          color: 'var(--text-muted)',
                          pointerEvents: 'none'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>6-Digit Email OTP</label>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RefreshCw style={{ width: '12px', height: '12px' }} />
                          <span>{otpSent ? "Resend Email OTP" : "Send OTP to Email"}</span>
                        </button>
                      </div>
                      <input 
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={forgotData.otp}
                        onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                        style={{
                          width: '100%',
                          height: '46px',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text)',
                          textAlign: 'center',
                          fontSize: '15px',
                          fontFamily: 'monospace',
                          letterSpacing: '4px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        height: '48px',
                        background: 'linear-gradient(135deg, #5b35e8, #713cff)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}
                    >
                      <span>Verify OTP & Proceed</span>
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>🔑 New Custom Password</label>
                      <input 
                        type="password"
                        required
                        placeholder="Enter new password (min 4 chars)"
                        value={forgotData.newPassword}
                        onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                        style={{
                          width: '100%',
                          height: '46px',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text)',
                          padding: '0 12px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>🔑 Passkey 1</label>
                        <input 
                          type="password"
                          required
                          placeholder="Passkey 1"
                          value={forgotData.passkey1}
                          onChange={(e) => setForgotData({ ...forgotData, passkey1: e.target.value })}
                          style={{
                            width: '100%',
                            height: '44px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            color: 'var(--text)',
                            padding: '0 10px',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>🔐 Passkey 2</label>
                        <input 
                          type="password"
                          required
                          placeholder="Passkey 2"
                          value={forgotData.passkey2}
                          onChange={(e) => setForgotData({ ...forgotData, passkey2: e.target.value })}
                          style={{
                            width: '100%',
                            height: '44px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            color: 'var(--text)',
                            padding: '0 10px',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{
                        width: '100%',
                        height: '48px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: forgotLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}
                    >
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                      <span>{forgotLoading ? "Resetting Credentials..." : "Reset Credentials & Sign In"}</span>
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
