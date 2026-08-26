"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
    const { theme, resolvedTheme, setTheme, mounted } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const themeOptions = [
        { id: "system", label: "System", icon: "💻", desc: "Match device theme" },
        { id: "light", label: "Light", icon: "☀️", desc: "Crisp white mode" },
        { id: "dark", label: "Dark", icon: "🌙", desc: "Deep dark mode" }
    ];

    const currentOption = themeOptions.find(o => o.id === theme) || themeOptions[0];
    const displayIcon = theme === "system" ? (resolvedTheme === "dark" ? "💻" : "💻") : currentOption.icon;

    if (!mounted) {
        return (
            <div className="theme-toggle-btn" style={{ minWidth: "40px", height: "40px", borderRadius: "9px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span>💻</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                className="theme-toggle-btn notranslate"
                translate="no"
                onClick={() => setIsOpen(!isOpen)}
                title={`Theme: ${currentOption.label} (${resolvedTheme} active)`}
                style={{
                    height: "40px",
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    borderRadius: "9px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                }}
            >
                <span style={{ fontSize: "14px" }}>{displayIcon}</span>
                <span style={{ fontSize: "12px", textTransform: "capitalize" }}>{theme === "system" ? "Auto" : theme}</span>
                <span style={{ fontSize: "10px", opacity: 0.7 }}>▾</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        minWidth: "165px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "6px",
                        boxShadow: "var(--shadow-lg)",
                        zIndex: 1000,
                        backdropFilter: "blur(12px)"
                    }}
                >
                    {themeOptions.map((opt) => {
                        const isSelected = theme === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    setTheme(opt.id);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                    padding: "8px 10px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: isSelected ? "var(--primary-soft)" : "transparent",
                                    color: isSelected ? "var(--primary)" : "var(--text)",
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = "var(--surface-2)";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "14px" }}>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                </div>
                                {isSelected && <span style={{ fontSize: "12px", color: "var(--primary)" }}>✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
