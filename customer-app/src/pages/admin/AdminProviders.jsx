import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  ShieldCheck, Clock, XCircle, Search, RefreshCw, Check, X,
  MapPin, Phone, Mail, Star, Briefcase, ExternalLink, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending Review' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All Providers' },
];

const REJECTION_PRESETS = [
  'Incomplete or unclear business description',
  'Unreachable or invalid contact phone number',
  'Service location/coordinates could not be verified',
  'Duplicate provider account',
];

export const AdminProviders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status')?.toUpperCase() || 'ALL';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState([]);
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, VERIFIED: 0, REJECTED: 0 });
  const [loading, setLoading] = useState(true);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingId, setSubmittingId] = useState(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllProviders(statusFilter, search);
      setProviders(data?.content || []);
      if (data?.counts) setCounts(data.counts);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load providers.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleTabChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    if (nextStatus === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ status: nextStatus });
    }
  };

  const handleVerifyAction = async (providerId, targetStatus, reason = '') => {
    setSubmittingId(providerId);
    try {
      const updated = await adminService.verifyProvider(providerId, targetStatus, reason);
      toast.success(`Provider marked as ${targetStatus}`);
      setRejectTarget(null);
      setRejectionReason('');
      if (selectedProvider?.id === providerId) {
        setSelectedProvider(updated);
      }
      window.dispatchEvent(new Event('localgo:admin-refresh'));
      await fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification update failed.');
    } finally {
      setSubmittingId(null);
    }
  };

  const statusBadge = (status) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Verified
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Pending Review
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Trust & Safety</span>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Provider Verification Console</h1>
          <p className="text-xs text-slate-500 mt-1">Inspect credentials, coverage location, and approve or reject service providers.</p>
        </div>

        <button
          type="button"
          onClick={fetchProviders}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Filter Tabs + Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}>
                {counts?.[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, service..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Providers List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No providers match this filter</p>
          <p className="text-xs text-slate-500 mt-1">Try switching tabs or clearing your search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Provider</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Services & Radius</th>
                <th className="p-4">Status</th>
                <th className="p-4">Performance</th>
                <th className="p-4 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 align-top">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider(p)}
                      className="text-left group"
                    >
                      <div className="font-bold text-slate-900 group-hover:text-blue-600">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{p.experienceYears ?? 0} yrs exp</span>
                        <span>•</span>
                        <span className={p.available ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                          {p.available ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </button>
                  </td>
                  <td className="p-4 align-top">
                    <div className="text-slate-900 font-medium">{p.email}</div>
                    <div className="text-slate-500 mt-0.5">{p.phone || 'No phone provided'}</div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(p.services || []).map((s) => (
                        <span key={s.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Starts ₹{p.startingPrice ?? 0} • {p.serviceRadiusKm ?? 10} km radius
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    {statusBadge(p.verificationStatus)}
                    {p.verificationNotes && (
                      <div className="text-[10px] text-slate-500 mt-1 max-w-[180px] truncate" title={p.verificationNotes}>
                        Note: {p.verificationNotes}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {p.rating > 0 ? p.rating.toFixed(1) : 'New'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.completedJobs ?? 0} jobs</div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedProvider(p)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-semibold text-[11px]"
                      >
                        Inspect
                      </button>
                      {p.verificationStatus !== 'VERIFIED' && (
                        <button
                          type="button"
                          disabled={submittingId === p.id}
                          onClick={() => handleVerifyAction(p.id, 'VERIFIED', 'Verified by LocalGo Admin')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[11px] disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {p.verificationStatus !== 'REJECTED' && (
                        <button
                          type="button"
                          disabled={submittingId === p.id}
                          onClick={() => {
                            setRejectTarget(p);
                            setRejectionReason(p.verificationNotes || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-md font-semibold text-[11px] disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provider Inspection Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Provider Profile Audit</div>
                <h2 className="text-lg font-bold mt-0.5">{selectedProvider.name}</h2>
                <p className="text-xs text-slate-300 mt-0.5">ID: {selectedProvider.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                {statusBadge(selectedProvider.verificationStatus)}
                <div className="text-slate-500">
                  {selectedProvider.reviewedAt
                    ? `Last reviewed: ${new Date(selectedProvider.reviewedAt).toLocaleString()}`
                    : 'Not reviewed yet'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${selectedProvider.email}`} className="hover:underline font-medium truncate">
                    {selectedProvider.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${selectedProvider.phone}`} className="hover:underline font-medium">
                    {selectedProvider.phone || 'Not provided'}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedProvider.experienceYears ?? 0} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedProvider.serviceRadiusKm ?? 10} km radius
                    {selectedProvider.latitude != null && selectedProvider.longitude != null && (
                      <> ({selectedProvider.latitude.toFixed(4)}, {selectedProvider.longitude.toFixed(4)})</>
                    )}
                  </span>
                </div>
              </div>

              {selectedProvider.latitude != null && selectedProvider.longitude != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedProvider.latitude},${selectedProvider.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Verify Base Location on Google Maps
                </a>
              )}

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Business Description</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedProvider.description || 'No description submitted.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5">Registered Services</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedProvider.services || []).map((s) => (
                    <span key={s.id} className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] font-semibold">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProvider.verificationNotes && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">Review Notes</span>
                  {selectedProvider.verificationNotes}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
              {selectedProvider.verificationStatus !== 'PENDING' && (
                <button
                  type="button"
                  disabled={submittingId === selectedProvider.id}
                  onClick={() => handleVerifyAction(selectedProvider.id, 'PENDING', 'Moved back to pending review')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-open Review
                </button>
              )}
              {selectedProvider.verificationStatus !== 'REJECTED' && (
                <button
                  type="button"
                  disabled={submittingId === selectedProvider.id}
                  onClick={() => {
                    setRejectTarget(selectedProvider);
                    setRejectionReason(selectedProvider.verificationNotes || '');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  <X className="w-3.5 h-3.5" /> Reject Provider
                </button>
              )}
              {selectedProvider.verificationStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  disabled={submittingId === selectedProvider.id}
                  onClick={() => handleVerifyAction(selectedProvider.id, 'VERIFIED', 'Approved by LocalGo Admin')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5" /> Approve & Verify
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explain why <strong className="text-slate-800">{rejectTarget.name}</strong> is being rejected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium text-left"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter clear verification feedback for the provider..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-slate-900 outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || submittingId === rejectTarget.id}
                onClick={() => handleVerifyAction(rejectTarget.id, 'REJECTED', rejectionReason.trim())}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {submittingId === rejectTarget.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
