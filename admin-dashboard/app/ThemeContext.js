"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "system",
    resolvedTheme: "dark",
    setTheme: () => {}
});

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState("system");
    const [resolvedTheme, setResolvedTheme] = useState("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedTheme = localStorage.getItem("theme") || "system";
        setThemeState(storedTheme);
        applyTheme(storedTheme);

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemChange = (e) => {
            const currentStored = localStorage.getItem("theme") || "system";
            if (currentStored === "system") {
                const resolved = e.matches ? "dark" : "light";
                setResolvedTheme(resolved);
                document.documentElement.setAttribute("data-theme", resolved);
                if (resolved === "dark") {
                    document.documentElement.classList.add("dark");
                    document.documentElement.classList.remove("light");
                } else {
                    document.documentElement.classList.add("light");
                    document.documentElement.classList.remove("dark");
                }
            }
        };

        mediaQuery.addEventListener("change", handleSystemChange);
        return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }, []);

    const applyTheme = (targetTheme) => {
        let resolved = targetTheme;
        if (targetTheme === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            resolved = isDark ? "dark" : "light";
        }

        setResolvedTheme(resolved);
        document.documentElement.setAttribute("data-theme", resolved);
        if (resolved === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
        }
    };

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme);
        }
        applyTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
