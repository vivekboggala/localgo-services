import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerPortalService } from '../../services/providerPortalService';
import { RequestCard } from '../../components/provider/RequestCard';
import { Inbox, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProviderRequests = () => {
  const navigate = useNavigate();
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
    fetchRequests();
  }, []);

  const handleOpen = (id) => {
    navigate(`/provider/jobs/${id}`);
  };

  const handleAccept = async (id) => {
    try {
      await providerPortalService.updateBookingStatus(id, 'ACCEPTED');
      toast.success('Request accepted! Opening job flow...');
      navigate(`/provider/jobs/${id}`);
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
              onOpen={handleOpen}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
