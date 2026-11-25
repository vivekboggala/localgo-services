import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { PROVIDER_AVAILABILITY_EVENT, dispatchAvailabilityChange } from '../../hooks/useProviderPresence';
import { RequestCard } from '../../components/provider/RequestCard';
import { ShieldCheck, Clock, Inbox, Wrench, CheckCircle2, DollarSign, ArrowRight, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProviderDashboard = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = () => {
    providerPortalService.getDashboardStats()
      .then((data) => {
        setStats(data);
        if (typeof data?.available === 'boolean') {
          dispatchAvailabilityChange(data.available);
        }
      })
      .catch((err) => console.error('Failed to load dashboard stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handleAvailabilitySync = (e) => {
      if (typeof e.detail?.available === 'boolean') {
        setStats((prev) => (prev ? { ...prev, available: e.detail.available } : prev));
      }
    };
    window.addEventListener(PROVIDER_AVAILABILITY_EVENT, handleAvailabilitySync);
    return () => window.removeEventListener(PROVIDER_AVAILABILITY_EVENT, handleAvailabilitySync);
  }, []);

  useEffect(() => {
    if (!uid) {
      setStats(null);
      setLoading(false);
      return;
    }

    refreshStats();

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', uid)
    );

    const unsubscribe = onSnapshot(
      q,
      () => {
        refreshStats();
      },
      (err) => {
        console.warn('Real-time bookings trigger error on dashboard:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleToggleAvailability = async () => {
    try {
      const target = typeof stats?.available === 'boolean' ? !stats.available : null;
      const available = await providerPortalService.toggleAvailability(target);
      setStats((prev) => ({ ...prev, available }));
      dispatchAvailabilityChange(available);
      toast.success(available ? 'You are now Online and accepting jobs' : 'You are now Offline');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update availability.');
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'ACCEPTED');
      toast.success('Request accepted! Opening job flow...');
      navigate(`/jobs/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept request failed.');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'REJECTED');
      toast.success('Request rejected.');
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject request failed.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
      </div>
    );
  }

  const pendingRequests = stats?.pendingRequests || [];
  const activeJobs = stats?.activeJobs || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Service Provider Portal</span>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">Welcome back, {stats?.providerName || user?.name}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
            {stats?.verificationStatus === 'VERIFIED' ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Clock className="w-3.5 h-3.5 text-amber-300" /> Verification Pending
              </span>
            )}
            <span>•</span>
            <span>Coverage Radius: {stats?.serviceRadiusKm ?? 15} km</span>
          </div>
        </div>

        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-xs transition-colors border ${
            stats?.available
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${stats?.available ? 'bg-emerald-200' : 'bg-rose-400'}`}></span>
          {stats?.available ? 'Available for Jobs' : 'Currently Offline'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/requests" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Pending Requests</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.todayRequestsCount ?? 0}</div>
          </div>
        </Link>

        <Link to="/jobs" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Jobs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.activeJobsCount ?? 0}</div>
          </div>
        </Link>

        <Link to="/bookings" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Completed Jobs</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats?.totalCompletedJobs ?? 0}</div>
          </div>
        </Link>

        <Link to="/earnings" className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Realized Earnings</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">₹{stats?.totalRealizedEarnings ?? 0}</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Incoming Requests</h2>
            <Link to="/requests" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
              No pending requests right now.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onOpen={(id) => navigate(`/jobs/${id}`)}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Active Jobs</h2>
            <Link to="/jobs" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeJobs.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
              Accepted requests will appear here for travel, Start OTP, and Completion OTP.
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{job.serviceName}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {job.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{job.customerName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {job.scheduledDate} {job.scheduledTime}</span>
                      <span className="flex items-center gap-1 truncate max-w-[180px]"><MapPin className="w-3 h-3 shrink-0" /> {job.address}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold shrink-0">
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
