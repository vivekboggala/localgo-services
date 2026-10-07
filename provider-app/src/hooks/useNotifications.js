import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { notificationService } from '../services/notificationService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const [unreadCount, setUnreadCount] = useState(0);

  // Fallback initial fetch via REST
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !uid) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.warn('Fallback getUnreadCount failed:', err);
    }
  }, [isAuthenticated, uid]);

  useEffect(() => {
    if (!isAuthenticated || !uid) {
      setUnreadCount(0);
      return;
    }

    // Initial load via REST fallback
    fetchUnreadCount();

    // Real-time listener: userId == uid, orderBy createdAt desc
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.docs.filter((docSnap) => {
          const data = docSnap.data();
          return !data.read && !data.isRead;
        }).length;
        setUnreadCount(count);
      },
      (error) => {
        console.warn('Real-time notifications listener error:', error);
        // Fallback to REST fetch on listener error
        fetchUnreadCount();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, uid, fetchUnreadCount]);

  return { unreadCount, fetchUnreadCount };
};
