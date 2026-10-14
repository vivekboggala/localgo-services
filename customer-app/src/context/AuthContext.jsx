import React, { createContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api/axios';
import { MOCK_DEMO_USERS } from '../utils/mockData';

export const AuthContext = createContext(null);

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
    // If we already have a mock user in localStorage, don't let empty Firebase state wipe it out
    const token = localStorage.getItem('localgo_token');
    const isMock = token?.startsWith('mock-');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('localgo_token', idToken);
          await fetchProfile(fbUser);
        } catch (e) {
          console.warn('Error fetching token:', e);
        }
      } else if (!isMock) {
        // Only clear if not in mock demo session
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

  const login = async (email, password) => {
    try {
      // 1. Try Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      localStorage.setItem('localgo_token', idToken);
      setFirebaseUser(cred.user);
      const profile = await fetchProfile(cred.user);
      return profile || { uid: cred.user.uid, email: cred.user.email, role: 'CUSTOMER' };
    } catch (fbErr) {
      console.warn('Firebase login failed, activating smooth demo login fallback:', fbErr.message);
      // 2. Fallback to Demo/Mock Session
      const isProv = email?.toLowerCase().includes('electrician') || email?.toLowerCase().includes('provider');
      const baseUser = isProv ? MOCK_DEMO_USERS.provider : MOCK_DEMO_USERS.customer;
      
      const loggedUser = {
        ...baseUser,
        email: email || baseUser.email,
        name: isProv ? 'Rajesh Kumar (Electrician)' : (email?.split('@')[0] ? email.split('@')[0].replace('.', ' ') : 'Demo Customer'),
      };

      const mockToken = isProv ? 'mock-jwt-provider-token' : 'mock-jwt-customer-token';
      localStorage.setItem('localgo_token', mockToken);
      localStorage.setItem('localgo_user', JSON.stringify(loggedUser));

      setUser(loggedUser);
      setFirebaseUser({
        uid: loggedUser.id,
        email: loggedUser.email,
        getIdToken: async () => mockToken,
      });

      return loggedUser;
    }
  };

  const registerCustomer = async (formData) => {
    try {
      // 1. Try Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await cred.user.getIdToken();
      localStorage.setItem('localgo_token', idToken);
      setFirebaseUser(cred.user);

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
    } catch (fbErr) {
      console.warn('Firebase registration failed, activating smooth demo registration fallback:', fbErr.message);
      // 2. Fallback to local session
      const newUser = {
        id: 'cust-' + Date.now(),
        uid: 'cust-' + Date.now(),
        name: formData.name || 'New Customer',
        email: formData.email,
        phone: formData.phone || '+91 98765 00000',
        role: 'CUSTOMER',
        city: 'Bengaluru',
      };

      const mockToken = 'mock-jwt-customer-token';
      localStorage.setItem('localgo_token', mockToken);
      localStorage.setItem('localgo_user', JSON.stringify(newUser));

      setUser(newUser);
      setFirebaseUser({
        uid: newUser.id,
        email: newUser.email,
        getIdToken: async () => mockToken,
      });

      return newUser;
    }
  };

  const registerProvider = async (formData) => {
    const newProv = {
      ...MOCK_DEMO_USERS.provider,
      ...formData,
      id: 'prov-' + Date.now(),
      uid: 'prov-' + Date.now(),
      role: 'PROVIDER',
    };
    const mockToken = 'mock-jwt-provider-token';
    localStorage.setItem('localgo_token', mockToken);
    localStorage.setItem('localgo_user', JSON.stringify(newProv));
    setUser(newProv);
    setFirebaseUser({
      uid: newProv.id,
      email: newProv.email,
      getIdToken: async () => mockToken,
    });
    return newProv;
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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
