import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

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

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
