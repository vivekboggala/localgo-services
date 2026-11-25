import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { RotateCw, Calendar, Clock, MapPin, User, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Jobs' },
  { key: 'REQUESTED', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ON_THE_WAY', label: 'On The Way' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export const ProviderBookings = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [allBookings, setAllBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    providerPortalService.getProviderBookings()
      .then((data) => setAllBookings(Array.isArray(data) ? data : (data?.content || [])))
      .catch(() => setAllBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setAllBookings([]);
      setLoading(false);
      return;
    }

    // 1. Initial REST fetch
    fetchBookings();

    // 2. Real-time Firestore snapshot listener
    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid)
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

        // Sort by scheduledDate / createdAt desc
        liveList.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        setAllBookings(liveList);
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time provider bookings listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const displayedBookings = activeTab === 'ALL'
    ? allBookings
    : allBookings.filter((b) => b.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job History & Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Filter and review all assigned service appointments</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500">No bookings found for the selected status filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {displayedBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/jobs/${b.id}`)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{b.id}</span>
                    <h3 className="font-bold text-slate-900 text-sm">{b.serviceName}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {b.customerName} ({b.customerPhone})</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.scheduledDate} at {b.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.address}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">₹{b.amount}</div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">{b.paymentMethod} • {b.paymentStatus}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
