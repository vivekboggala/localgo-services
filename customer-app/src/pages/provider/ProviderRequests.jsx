import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { RequestCard } from '../../components/provider/RequestCard';
import { Inbox, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProviderRequests = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    setLoading(true);
    providerPortalService.getPendingRequests()
      .then((data) => setRequests(Array.isArray(data) ? data : (data?.content || [])))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setRequests([]);
      setLoading(false);
      return;
    }

    fetchRequests();

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid),
      where('status', '==', 'REQUESTED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveRequests = snapshot.docs.map((docSnap) => {
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
        if (liveRequests.length > 0) {
          setRequests(liveRequests);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time provider requests listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleAccept = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'ACCEPTED');
      toast.success('Request accepted!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept request failed.');
    }
  };

  const handleReject = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'REJECTED');
      toast.success('Request rejected.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject request failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incoming Booking Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Review customer requests and accept or reject</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base">No pending requests</h3>
          <p className="text-xs text-slate-500 mt-1">New requests from nearby customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
