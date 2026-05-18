import { createContext, useState, useEffect } from 'react';
import api from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Derived value — single source of truth from the user object
  const creditBalance = user?.creditBalance ?? 0;

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api('/api/auth/me');
        setUser(res.data);
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  /**
   * Optimistically updates the credit balance in the user object.
   * Called after a successful credit transaction or chatbot use.
   */
  const updateCredits = (newBalance) => {
    setUser(prev => prev ? { ...prev, creditBalance: newBalance } : prev);
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
