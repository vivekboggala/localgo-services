import React, { useState, useEffect } from 'react';
import { providerPortalService } from '../../services/providerPortalService';
import { ActiveJobCard } from '../../components/provider/ActiveJobCard';
import { Wrench } from 'lucide-react';

export const ProviderActiveJob = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    providerPortalService.getProviderBookings()
      .then((data) => {
        const activeList = (data.content || []).filter(
          (b) => b.status === 'ACCEPTED' || b.status === 'ON_THE_WAY' || b.status === 'IN_PROGRESS'
        );
        setJobs(activeList);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await providerPortalService.updateBookingStatus(id, status);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleCancelJob = async (id) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await providerPortalService.updateBookingStatus(id, 'CANCELLED', reason);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Jobs</h1>
        <p className="text-xs text-slate-500 mt-1">Track and update active doorstep service progress</p>
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
            <ActiveJobCard
              key={job.id}
              job={job}
              onUpdateStatus={handleUpdateStatus}
              onCancelJob={handleCancelJob}
            />
          ))}
        </div>
      )}
    </div>
  );
};
