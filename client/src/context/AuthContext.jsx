import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("agx_token"));
  const [isPasskeyUnlocked, setIsPasskeyUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);

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
      const passkeyStatus = await api.getPasskeyStatus().catch(() => ({ unlocked: false }));
      setIsPasskeyUnlocked(passkeyStatus.unlocked);
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
    // Open passkey unlock modal after login
    setShowPasskeyModal(true);
    return res;
  }

  async function register(data) {
    const res = await api.register(data);
    localStorage.setItem("agx_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  async function unlockWithPasskey(passkey) {
    const res = await api.verifyPasskey(passkey);
    sessionStorage.setItem("agx_master_passkey", passkey);
    setIsPasskeyUnlocked(true);
    setShowPasskeyModal(false);
    return res;
  }

  function lockDashboard() {
    api.lockPasskey().catch(() => {});
    sessionStorage.removeItem("agx_master_passkey");
    setIsPasskeyUnlocked(false);
  }

  function logout() {
    localStorage.removeItem("agx_token");
    sessionStorage.removeItem("agx_master_passkey");
    setToken(null);
    setUser(null);
    setIsPasskeyUnlocked(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isPasskeyUnlocked,
        showPasskeyModal,
        setShowPasskeyModal,
        login,
        register,
        unlockWithPasskey,
        lockDashboard,
        logout,
        refreshProfile: loadProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
