import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { MOCK_DEMO_USERS } from '../utils/mockData';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('localgo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('localgo_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('localgo_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          // If mock token, keep the user
          if (!token.startsWith('mock-')) {
            logout();
          }
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
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token: jwtToken, user: userData } = res.data.data;
        handleAuthSuccess(jwtToken, userData);
        return userData;
      }
    } catch (e) {
      const isProv = email?.toLowerCase().includes('electrician') || email?.toLowerCase().includes('provider');
      const base = isProv ? MOCK_DEMO_USERS.provider : MOCK_DEMO_USERS.customer;
      const loggedUser = { ...base, email: email || base.email };
      const mockToken = isProv ? 'mock-jwt-provider-token' : 'mock-jwt-customer-token';
      handleAuthSuccess(mockToken, loggedUser);
      return loggedUser;
    }
  };

  const registerCustomer = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data?.success) {
        const { token: jwtToken, user: userData } = res.data.data;
        if (jwtToken) handleAuthSuccess(jwtToken, userData);
        return userData;
      }
    } catch (e) {
      const newUser = {
        id: 'cust-' + Date.now(),
        name: formData.name || 'New Customer',
        email: formData.email,
        phone: formData.phone || '+91 98765 00000',
        role: 'CUSTOMER',
      };
      handleAuthSuccess('mock-jwt-customer-token', newUser);
      return newUser;
    }
  };

  const registerProvider = async (formData) => {
    try {
      const res = await api.post('/auth/register/provider', formData);
      if (res.data?.success) {
        const { token: jwtToken, user: userData } = res.data.data;
        if (jwtToken) handleAuthSuccess(jwtToken, userData);
        return userData;
      }
    } catch (e) {
      const newProv = {
        ...MOCK_DEMO_USERS.provider,
        ...formData,
        id: 'prov-' + Date.now(),
        name: formData.name || 'Rajesh Kumar (Electrician)',
        role: 'PROVIDER',
      };
      handleAuthSuccess('mock-jwt-provider-token', newProv);
      return newProv;
    }
  };

  const loginDemo = (role = 'CUSTOMER') => {
    let demoUser = MOCK_DEMO_USERS.customer;
    let mockToken = 'mock-jwt-customer-token';

    if (role === 'PROVIDER') {
      demoUser = MOCK_DEMO_USERS.provider;
      mockToken = 'mock-jwt-provider-token';
    } else if (role === 'ADMIN') {
      demoUser = MOCK_DEMO_USERS.admin;
      mockToken = 'mock-jwt-admin-token';
    }

    handleAuthSuccess(mockToken, demoUser);
    return demoUser;
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
        isAuthenticated: !!user,
        isCustomer: user?.role === 'CUSTOMER',
        isProvider: user?.role === 'PROVIDER',
        isAdmin: user?.role === 'ADMIN',
        login,
        registerCustomer,
        registerProvider,
        loginDemo,
        handleAuthSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
