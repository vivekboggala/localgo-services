import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService';
import { BookingCard } from '../../components/customer/BookingCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Calendar } from 'lucide-react';

const TABS = ['ALL', 'REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];

export const MyBookingsPage = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;

  const [activeTab, setActiveTab] = useState('ALL');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setAllBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // 1. Initial REST fetch
    bookingService.getMyBookings()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        setAllBookings(list);
      })
      .catch((err) => {
        console.warn('Initial REST load error for my bookings:', err);
      })
      .finally(() => setLoading(false));

    // 2. Real-time Firestore snapshot listener
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const amountInRupees = data.amount != null
            ? (Number(data.amount) / 100)
            : 0;

          return {
            id: docSnap.id,
            ...data,
            amount: amountInRupees,
          };
        });

        // Sort by createdAt descending
        liveList.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        if (liveList.length > 0) {
          setAllBookings(liveList);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time bookings listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const displayedBookings = activeTab === 'ALL'
    ? allBookings
    : allBookings.filter((b) => b.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
        <p className="text-xs text-slate-500 mt-1">Track status timeline and manage your service requests</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : displayedBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base mb-1">No bookings found</h3>
          <p className="text-xs text-slate-500">Your requested and active services will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
};
