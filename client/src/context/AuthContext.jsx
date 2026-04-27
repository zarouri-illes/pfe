import { createContext, useState, useEffect } from 'react';
import api from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api('/api/auth/me');
        setUser(res.data);
        setCreditBalance(res.data.creditBalance);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    // Note: we do NOT persist the user object in localStorage — it is re-fetched from /api/auth/me
    setToken(newToken);
    setUser(userData);
    setCreditBalance(userData.creditBalance);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCreditBalance(0);
  };

  const updateCredits = (newBalance) => {
    setCreditBalance(newBalance);
  };

  return (
    <AuthContext.Provider value={{
      user, token, creditBalance, isLoading, isAuthenticated,
      login, logout, updateCredits
    }}>
      {children}
    </AuthContext.Provider>
  );
}
