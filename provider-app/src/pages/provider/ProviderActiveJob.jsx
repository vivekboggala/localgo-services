import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Wrench, RotateCw, Calendar, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
import { ProviderJobDetailPanel } from './ProviderJobDetailPage';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonList,
  StatusBadge,
} from '../../components/ui';
import { formatCurrency, getServiceIconComponent } from '../../utils/helpers';

const sortByScheduledTime = (list) => {
  return [...list].sort((a, b) => {
    const dtA = new Date(`${a.scheduledDate || '2099-12-31'}T${a.scheduledTime || '23:59'}`).getTime();
    const dtB = new Date(`${b.scheduledDate || '2099-12-31'}T${b.scheduledTime || '23:59'}`).getTime();
    return (isNaN(dtA) ? 0 : dtA) - (isNaN(dtB) ? 0 : dtB);
  });
};

export const ProviderActiveJob = () => {
  const { user, firebaseUser } = useAuth();
  const uid = firebaseUser?.uid || user?.id;
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = () => {
    setLoading(true);
    setError('');
    providerPortalService.getProviderBookings(null, 0, 50)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        const activeList = sortByScheduledTime(
          list.filter((b) => ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status))
        );
        setJobs(activeList);
        if (activeList.length > 0) {
          setSelectedJobId((prev) =>
            prev && activeList.some((j) => j.id === prev) ? prev : activeList[0].id
          );
        } else {
          setSelectedJobId(null);
        }
      })
      .catch((err) => {
        setJobs([]);
        setError(err.response?.data?.message || 'Unable to load active jobs.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!uid) {
      setJobs([]);
      setLoading(false);
      return undefined;
    }

    fetchJobs();

    const q = query(collection(db, 'bookings'), where('providerId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveActive = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(data.status)) {
            const amountInRupees = data.amount != null ? Number(data.amount) / 100 : 0;
            liveActive.push({ id: docSnap.id, ...data, amount: amountInRupees });
          }
        });
        const sorted = sortByScheduledTime(liveActive);
        setJobs(sorted);
        if (sorted.length > 0) {
          setSelectedJobId((prev) =>
            prev && sorted.some((j) => j.id === prev) ? prev : sorted[0].id
          );
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time provider active jobs listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const handleCardSelect = (jobId) => {
    if (window.innerWidth >= 1024) {
      setSelectedJobId(jobId);
    } else {
      navigate(`/jobs/${jobId}`);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Jobs"
        subtitle="Master-detail dispatch queue sorted by scheduled time"
        actions={
          <Button
            variant="secondary"
            onClick={fetchJobs}
            leftIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            className="min-h-[44px] py-2 px-3.5 text-ds-12"
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={fetchJobs} />
      ) : loading ? (
        <SkeletonList count={3} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-7 h-7" strokeWidth={2} />}
          title="No active jobs right now"
          description="Accepted requests appear here sorted by scheduled slot so you can jump straight into navigation and OTP check-in."
          actionLabel="View Incoming Requests"
          actionVariant="accent"
          onAction={() => navigate('/requests')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT (4 Cols): Active Job Queue */}
          <div className="lg:col-span-4 space-y-3.5">
            {jobs.map((job) => {
              const ServiceIcon = getServiceIconComponent(job.serviceName);
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardSelect(job.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardSelect(job.id);
                    }
                  }}
                  className={`bg-brand-white dark:bg-gray-900 rounded-sheet p-4 shadow-card cursor-pointer space-y-3 transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow ${
                    isSelected
                      ? 'lg:border-brand-yellow border-gray-200 dark:border-brand-yellow'
                      : 'border-gray-200 dark:border-gray-600/30 hover:border-brand-yellow/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-card bg-brand-yellowSoft dark:bg-brand-yellow/15 border border-brand-yellow text-brand-ink dark:text-brand-yellow flex items-center justify-center shrink-0">
                        <ServiceIcon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display font-bold text-ds-14 text-brand-ink dark:text-brand-white truncate">
                          {job.serviceName}
                        </h2>
                        <p className="text-ds-12 text-gray-600 dark:text-gray-200 inline-flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5 text-brand-yellow" />
                          <span className="truncate">{job.customerName}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="bg-gray-50 dark:bg-brand-ink rounded-card p-3 border border-gray-200 dark:border-gray-600/25 space-y-1.5 text-ds-12">
                    <div className="flex flex-wrap items-center gap-3 font-semibold text-brand-ink dark:text-brand-white">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-yellow" /> {job.scheduledDate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-yellow" /> {job.scheduledTime}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-brand-yellow shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{job.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="font-display font-extrabold text-ds-16 text-brand-ink dark:text-brand-yellow">
                      {formatCurrency(job.amount)}
                    </span>

                    <Button
                      variant="accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardSelect(job.id);
                      }}
                      rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={2.2} />}
                      className="min-h-[38px] py-1.5 px-3 text-ds-12"
                    >
                      {isSelected ? 'Selected' : 'Open'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT (8 Cols): Selected Job Master-Detail View */}
          <div className="hidden lg:block lg:col-span-8">
            {selectedJob && (
              <ProviderJobDetailPanel
                jobId={selectedJob.id}
                embedded={true}
                onStatusChanged={fetchJobs}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
