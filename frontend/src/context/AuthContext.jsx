import React, { createContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api/axios';
import { MOCK_DEMO_USERS } from '../utils/mockData';

export const AuthContext = createContext(null);

const mapFirebaseLoginError = (err) => {
  const code = err?.code || '';
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Invalid email or password. Please try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Please reset your password or try again later.';
  }
  return err?.response?.data?.message || err?.message || 'Sign in failed. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('localgo_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState(() => {
    try {
      const saved = localStorage.getItem('localgo_user');
      if (saved) {
        const u = JSON.parse(saved);
        return { uid: u.id, email: u.email, getIdToken: async () => localStorage.getItem('localgo_token') || 'mock-jwt-token' };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
        localStorage.setItem('localgo_user', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem('localgo_token');
    const isMock = token?.startsWith('mock-');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('localgo_token', idToken);
          const profile = await fetchProfile();
          if (profile && profile.emailVerified === false) {
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
            localStorage.removeItem('localgo_token');
            localStorage.removeItem('localgo_user');
          }
        } catch (e) {
          console.warn('Error fetching token:', e);
        }
      } else if (!isMock) {
        const saved = localStorage.getItem('localgo_user');
        if (!saved) {
          setUser(null);
          setFirebaseUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (jwtToken, userData) => {
    localStorage.setItem('localgo_token', jwtToken);
    localStorage.setItem('localgo_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      localStorage.setItem('localgo_token', idToken);
      setFirebaseUser(cred.user);

      const profile = await fetchProfile();
      if (profile && profile.emailVerified === false) {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
        throw new Error('EMAIL_NOT_VERIFIED: Your email is not verified. Please verify using the 6-digit OTP code.');
      }

      if (!profile && !cred.user.emailVerified) {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
        throw new Error('EMAIL_NOT_VERIFIED: Your email is not verified. Please verify using the 6-digit OTP code.');
      }

      return profile || { uid: cred.user.uid, email: cred.user.email, role: 'CUSTOMER', emailVerified: true };
    } catch (fbErr) {
      throw new Error(mapFirebaseLoginError(fbErr));
    }
  };

  const registerCustomer = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (!res.data?.success || !res.data?.data?.user) {
      throw new Error(res.data?.message || 'Registration failed.');
    }

    const cred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
    const idToken = await cred.user.getIdToken();
    localStorage.setItem('localgo_token', idToken);
    setFirebaseUser(cred.user);

    const createdUser = res.data.data.user;
    setUser(createdUser);
    localStorage.setItem('localgo_user', JSON.stringify(createdUser));
    return createdUser;
  };

  const registerProvider = async (formData) => {
    const res = await api.post('/auth/register/provider', formData);
    if (!res.data?.success || !res.data?.data?.user) {
      throw new Error(res.data?.message || 'Provider registration failed.');
    }

    const cred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
    const idToken = await cred.user.getIdToken();
    localStorage.setItem('localgo_token', idToken);
    setFirebaseUser(cred.user);

    const createdUser = res.data.data.user;
    setUser(createdUser);
    localStorage.setItem('localgo_user', JSON.stringify(createdUser));
    return createdUser;
  };

  const loginDemo = (role = 'CUSTOMER') => {
    let demoUser = MOCK_DEMO_USERS.customer;
    let token = 'mock-jwt-customer-token';

    if (role === 'PROVIDER') {
      demoUser = MOCK_DEMO_USERS.provider;
      token = 'mock-jwt-provider-token';
    } else if (role === 'ADMIN') {
      demoUser = MOCK_DEMO_USERS.admin;
      token = 'mock-jwt-admin-token';
    }

    localStorage.setItem('localgo_token', token);
    localStorage.setItem('localgo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setFirebaseUser({
      uid: demoUser.id,
      email: demoUser.email,
      getIdToken: async () => token,
    });
    return demoUser;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('localgo_token');
    localStorage.removeItem('localgo_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
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
