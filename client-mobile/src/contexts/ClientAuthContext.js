import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { clientAuthService } from '../services/api';

const ClientAuthContext = createContext(null);

const STORAGE_KEY = 'easystay_client_user';

export function ClientAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (phone, code) => {
    const res = await clientAuthService.login(phone, code);
    if (res.data?.success) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data?.message || '登录失败');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateNickname = useCallback(async (nickname) => {
    if (!user) return;
    const res = await clientAuthService.updateProfile(user.id, nickname);
    if (res.data?.success) {
      setUser(res.data.data);
    }
  }, [user]);

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    updateNickname
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error('useClientAuth must be used within ClientAuthProvider');
  return ctx;
}

export default ClientAuthContext;
