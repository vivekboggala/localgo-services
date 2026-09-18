import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('localgo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('localgo_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('localgo_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const handleAuthSuccess = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('localgo_token', jwtToken);
    localStorage.setItem('localgo_user', JSON.stringify(userData));
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: jwtToken, user: userData } = res.data.data;
      handleAuthSuccess(jwtToken, userData);
      return userData;
    }
  };

  const registerCustomer = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { token: jwtToken, user: userData } = res.data.data;
      if (jwtToken) {
        handleAuthSuccess(jwtToken, userData);
      }
      return userData;
    }
  };

  const registerProvider = async (formData) => {
    const res = await api.post('/auth/register/provider', formData);
    if (res.data.success) {
      const { token: jwtToken, user: userData } = res.data.data;
      if (jwtToken) {
        handleAuthSuccess(jwtToken, userData);
      }
      return userData;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('localgo_token');
    localStorage.removeItem('localgo_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isCustomer: user?.role === 'CUSTOMER',
        isProvider: user?.role === 'PROVIDER',
        isAdmin: user?.role === 'ADMIN',
        login,
        registerCustomer,
        registerProvider,
        handleAuthSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
