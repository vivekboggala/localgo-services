import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { ActiveJobCard } from '../../components/provider/ActiveJobCard';
import { Wrench, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProviderActiveJob = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    providerPortalService.getProviderBookings()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        const activeList = list.filter(
          (b) => b.status === 'ACCEPTED' || b.status === 'ON_THE_WAY' || b.status === 'ARRIVED' || b.status === 'IN_PROGRESS'
        );
        setJobs(activeList);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setJobs([]);
      setLoading(false);
      return;
    }

    // 1. Initial REST fetch
    fetchJobs();

    // 2. Real-time Firestore snapshot listener on provider's bookings
    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveActive = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(data.status)) {
            const amountInRupees = data.amount != null
              ? (Number(data.amount) / 100)
              : 0;
            liveActive.push({
              id: docSnap.id,
              ...data,
              amount: amountInRupees,
            });
          }
        });

        // Sort by scheduledDate / createdAt
        liveActive.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        setJobs(liveActive);
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time provider active jobs listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleUpdateStatus = async (id, status, otp = null) => {
    try {
      await providerPortalService.updateBookingStatus(id, status, null, otp);
      toast.success(`Booking status updated to ${status.replace('_', ' ')}!`);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed.');
      throw err;
    }
  };

  const handleCancelJob = async (id) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await providerPortalService.updateBookingStatus(id, 'CANCELLED', reason);
      toast.success('Job cancelled successfully.');
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Jobs</h1>
          <p className="text-xs text-slate-500 mt-1">Track and update active doorstep service progress</p>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base">No active jobs in progress</h3>
          <p className="text-xs text-slate-500 mt-1">Accepted requests will appear here for execution.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="space-y-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Open Step-by-Step Flow →
                </button>
              </div>
              <ActiveJobCard
                job={job}
                onUpdateStatus={handleUpdateStatus}
                onCancelJob={handleCancelJob}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
