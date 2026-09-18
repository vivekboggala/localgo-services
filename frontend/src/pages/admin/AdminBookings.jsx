import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllBookings()
      .then((data) => setBookings(data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-gray-900">Platform Bookings Oversight</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Service</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cancelled Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 font-medium">
                  <td className="p-4 font-bold">#{b.id}</td>
                  <td className="p-4">{b.customerName}</td>
                  <td className="p-4">{b.providerName}</td>
                  <td className="p-4">{b.serviceName}</td>
                  <td className="p-4">{b.scheduledDate}</td>
                  <td className="p-4 font-bold">{b.status}</td>
                  <td className="p-4 text-[10px] text-gray-500">
                    {b.cancelledBy ? `${b.cancelledBy}: ${b.cancellationReason}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
