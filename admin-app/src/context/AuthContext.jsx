import React, { createContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api/axios';

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
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.role === 'ADMIN' ? parsed : null;
    } catch (e) {
      return null;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(() => !localStorage.getItem('localgo_user'));

  const clearSession = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('localgo_token');
    localStorage.removeItem('localgo_user');
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        const profile = res.data.data;
        if (profile.role !== 'ADMIN') {
          await clearSession();
          return null;
        }
        setUser(profile);
        localStorage.setItem('localgo_user', JSON.stringify(profile));
        return profile;
      }
    } catch (err) {
      console.warn('Failed to fetch admin profile:', err);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('localgo_token', idToken);
          await fetchProfile();
        } catch (e) {
          console.warn('Error fetching admin token:', e);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      localStorage.setItem('localgo_token', idToken);
      setFirebaseUser(cred.user);

      const res = await api.get('/auth/me');
      const profile = res.data?.success ? res.data.data : null;

      if (!profile || profile.role !== 'ADMIN') {
        await clearSession();
        throw new Error('Access restricted to LocalGo Administrators only.');
      }

      setUser(profile);
      localStorage.setItem('localgo_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      throw new Error(mapFirebaseLoginError(err));
    }
  };

  const logout = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAuthenticated: !!user && user.role === 'ADMIN',
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
