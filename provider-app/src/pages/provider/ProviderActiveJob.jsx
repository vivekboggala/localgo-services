import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Wrench, RotateCw, Calendar, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { providerPortalService } from '../../services/providerPortalService';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = () => {
    setLoading(true);
    setError('');
    providerPortalService.getProviderBookings(null, 0, 50)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content || []);
        const activeList = list.filter((b) =>
          ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status)
        );
        setJobs(sortByScheduledTime(activeList));
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
        setJobs(sortByScheduledTime(liveActive));
        setLoading(false);
      },
      (err) => {
        console.warn('Real-time provider active jobs listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        title="Active Jobs"
        subtitle="Sorted by upcoming scheduled time"
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
        <div className="space-y-4">
          {jobs.map((job) => {
            const ServiceIcon = getServiceIconComponent(job.serviceName);
            return (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="bg-brand-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600/30 hover:border-brand-yellow rounded-sheet p-5 shadow-card cursor-pointer space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-card bg-brand-yellowSoft dark:bg-brand-yellow/15 border border-brand-yellow text-brand-ink dark:text-brand-yellow flex items-center justify-center shrink-0">
                      <ServiceIcon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white truncate">
                        {job.serviceName}
                      </h2>
                      <p className="text-ds-12 text-gray-600 dark:text-gray-200 inline-flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-brand-yellow" />
                        <span>{job.customerName}</span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="bg-gray-50 dark:bg-brand-ink rounded-card p-3.5 border border-gray-200 dark:border-gray-600/25 space-y-2 text-ds-12">
                  <div className="flex flex-wrap items-center gap-4 font-semibold text-brand-ink dark:text-brand-white">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-yellow" /> {job.scheduledDate}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-yellow" /> {job.scheduledTime}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                    <span>{job.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-gray-400 block">
                      {job.paymentMethod} Job Value
                    </span>
                    <span className="font-display font-extrabold text-ds-20 text-brand-ink dark:text-brand-yellow">
                      {formatCurrency(job.amount)}
                    </span>
                  </div>

                  <Button
                    variant="accent"
                    size="md"
                    rightIcon={<ArrowRight className="w-5 h-5" strokeWidth={2.2} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/jobs/${job.id}`);
                    }}
                    className="min-w-[140px]"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
