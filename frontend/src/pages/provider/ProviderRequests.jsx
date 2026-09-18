import React, { useState, useEffect } from 'react';
import { providerPortalService } from '../../services/providerPortalService';
import { RequestCard } from '../../components/provider/RequestCard';
import { Inbox } from 'lucide-react';

export const ProviderRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    setLoading(true);
    providerPortalService.getPendingRequests()
      .then((data) => setRequests(data.content || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'ACCEPTED');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Accept request failed.');
    }
  };

  const handleReject = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'REJECTED');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Reject request failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incoming Booking Requests</h1>
        <p className="text-xs text-slate-500 mt-1">Review customer requests and accept or reject</p>
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
