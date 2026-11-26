import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import PaginationBar from '../../components/common/PaginationBar';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cursorStack, setCursorStack] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentCursor = cursorStack[cursorStack.length - 1];

  const loadBookings = useCallback(() => {
    setLoading(true);
    adminService.getAllBookings(statusFilter, 15, currentCursor)
      .then((data) => {
        setBookings(data?.content || []);
        setNextCursor(data?.nextCursor || null);
        setHasMore(Boolean(data?.hasMore));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, [statusFilter, currentCursor]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleStatusChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCursorStack([null]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Marketplace Activity</span>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">All Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor real-time service requests, active jobs, and completed payouts.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
        >
          {['ALL', 'REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No bookings match this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Service</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{b.serviceName}</div>
                    <div className="text-[11px] text-slate-400">#{b.id}</div>
                  </td>
                  <td className="p-4 text-slate-700">{b.customerName}</td>
                  <td className="p-4 text-slate-700">{b.providerName}</td>
                  <td className="p-4 text-slate-600">{b.scheduledDate} {b.scheduledTime}</td>
                  <td className="p-4 font-bold text-slate-900">₹{b.amount} ({b.paymentMethod} • {b.paymentStatus})</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {b.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        pageIndex={cursorStack.length - 1}
        hasPrev={cursorStack.length > 1}
        hasNext={hasMore && Boolean(nextCursor)}
        itemCount={bookings.length}
        loading={loading}
        onPrev={() => setCursorStack((prev) => prev.slice(0, -1))}
        onNext={() => nextCursor && setCursorStack((prev) => [...prev, nextCursor])}
      />
    </div>
  );
};
