import React, { createContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (fbUser) => {
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('localgo_token', idToken);
          await fetchProfile(fbUser);
        } catch (e) {
          console.warn('Error fetching token:', e);
        }
      } else {
        setUser(null);
        localStorage.removeItem('localgo_token');
        localStorage.removeItem('localgo_user');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    localStorage.setItem('localgo_token', idToken);
    const profile = await fetchProfile(cred.user);
    return profile || { uid: cred.user.uid, email: cred.user.email };
  };

  const registerCustomer = async (formData) => {
    const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
    const idToken = await cred.user.getIdToken();
    localStorage.setItem('localgo_token', idToken);
    const res = await api.post('/auth/register', {
      ...formData,
      uid: cred.user.uid,
    });
    if (res.data?.success) {
      setUser(res.data.data.user);
      localStorage.setItem('localgo_user', JSON.stringify(res.data.data.user));
      return res.data.data.user;
    }
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
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
        isAuthenticated: !!firebaseUser && !!user,
        isCustomer: user?.role === 'CUSTOMER',
        login,
        registerCustomer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
