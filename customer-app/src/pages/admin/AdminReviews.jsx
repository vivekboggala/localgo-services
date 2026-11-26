import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { Star, EyeOff, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(() => {
    setLoading(true);
    adminService.getAllReviews()
      .then((data) => setReviews(data?.content || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleToggleHide = async (id) => {
    try {
      const hidden = await adminService.toggleHideReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, hidden } : r)));
      toast.success(hidden ? 'Review hidden from public view' : 'Review restored');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update review.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Quality Control</span>
        <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Review Moderation</h1>
        <p className="text-xs text-slate-500 mt-1">Audit customer ratings and hide inappropriate reviews if needed.</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No reviews submitted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className={`bg-white rounded-xl border p-5 space-y-3 ${r.hidden ? 'border-rose-200 opacity-75' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {r.rating}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{r.customerName || 'Customer'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleHide(r.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  {r.hidden ? <><Eye className="w-3.5 h-3.5" /> Restore</> : <><EyeOff className="w-3.5 h-3.5" /> Hide</>}
                </button>
              </div>
              <p className="text-xs text-slate-600">{r.comment || 'No written comment.'}</p>
              <div className="text-[11px] text-slate-400">Provider ID: {r.providerId} • Booking: {r.bookingId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
