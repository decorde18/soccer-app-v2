"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch minimal user info (or validate token)
    async function loadUser() {
      try {
        const res = await fetch("/api/profile");

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        setUser(null);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    // Call your API to authenticate
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  const logout = () => {
    setUser(null);
    document.cookie = "token=; Max-Age=0; path=/"; // clear cookie
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
