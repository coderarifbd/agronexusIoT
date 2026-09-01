import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("agx_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function loadProfile() {
    try {
      const res = await api.getProfile();
      setUser(res.user);
    } catch (err) {
      console.error("Profile load failed:", err);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(identifier, password) {
    const res = await api.login({ identifier, password });
    localStorage.setItem("agx_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  async function register(data) {
    const res = await api.register(data);
    localStorage.setItem("agx_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  function logout() {
    localStorage.removeItem("agx_token");
    sessionStorage.removeItem("agx_master_passkey");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isPasskeyUnlocked: true, // Always unlocked now
        showPasskeyModal: false,
        setShowPasskeyModal: () => {},
        login,
        register,
        unlockWithPasskey: async () => ({ unlocked: true }),
        lockDashboard: () => {},
        logout,
        refreshProfile: loadProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
