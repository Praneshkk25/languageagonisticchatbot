"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ShieldCheck, ChevronRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "admin", password: "admin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (formData.username.trim().toLowerCase() === "admin" && formData.password === "admin") {
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_user", JSON.stringify({ username: "admin", role: "Super Administrator" }));
        }
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Please use admin / admin.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <main style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 15%, rgba(91, 53, 232, 0.2), transparent 55%), radial-gradient(circle at 80% 85%, rgba(113, 60, 255, 0.14), transparent 45%), var(--bg)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px'
    }}>
      {/* Top Bar with Theme Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '10px' }}>
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

      {/* Admin Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--card-bg, rgba(12, 23, 48, 0.95))',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.5)), 0 0 30px rgba(91, 53, 232, 0.15)',
          backdropFilter: 'blur(20px)',
          padding: '36px 30px',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header Section */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: '#ffffff',
              border: '2px solid rgba(91, 53, 232, 0.3)',
              padding: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
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
            <ShieldCheck style={{ width: '13px', height: '13px' }} />
            <span>Sona College Administrator</span>
          </div>

          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>
            Admin Portal Sign In
          </h1>
          <p style={{
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            maxWidth: '340px'
          }}>
            Institutional Scholarship Verification, Stage Approvals & DBT Sanction Pipeline
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Username Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              paddingLeft: '2px'
            }}>
              Admin Username
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                required
                placeholder="Enter admin username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              <User style={{
                position: 'absolute',
                right: '14px',
                width: '18px',
                height: '18px',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }} />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                paddingLeft: '2px'
              }}>
                Security Password
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
                placeholder="Enter password"
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
                  outline: 'none',
                  transition: 'all 0.2s ease'
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

          {/* Error Message */}
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
                <span>Sign In to Admin Dashboard</span>
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Restricted Institutional Access
          </p>
          <p style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--primary)' }}>
            Authorized Sona College Officials Only
          </p>
        </div>
      </motion.div>
    </main>
  );
}
