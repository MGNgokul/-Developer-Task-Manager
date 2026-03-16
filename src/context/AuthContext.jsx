import { createContext, useState, useEffect, useRef } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const register = (data) => {
    const normalized = {
      ...data,
      name: String(data?.name || "").trim(),
      email: String(data?.email || "").trim().toLowerCase(),
      password: String(data?.password || ""),
    };
    localStorage.setItem("registeredUser", JSON.stringify(normalized));
  };

  const login = (email, password) => {
    const saved = JSON.parse(localStorage.getItem("registeredUser"));
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error("Email and password are required");
    }

    if (!saved || saved.email !== normalizedEmail || saved.password !== normalizedPassword) {
      throw new Error("Invalid Credentials");
    }
    localStorage.setItem("user", JSON.stringify(saved));
    setUser(saved);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    if (!user) return undefined;

    let timeoutMinutes = 0;
    try {
      const settings = JSON.parse(localStorage.getItem("appSettings")) || {};
      timeoutMinutes = Number(settings?.security?.sessionTimeoutMinutes || 0);
    } catch {
      timeoutMinutes = 0;
    }

    if (!Number.isFinite(timeoutMinutes) || timeoutMinutes <= 0) return undefined;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        logout();
      }, timeoutMs);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer));
    window.addEventListener("app-settings-updated", resetIdleTimer);
    resetIdleTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
      window.removeEventListener("app-settings-updated", resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
