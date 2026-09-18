import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    adminService.getAllReviews()
      .then((data) => setReviews(data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleHide = async (id) => {
    try {
      await adminService.toggleHideReview(id);
      fetchReviews();
    } catch (err) {
      alert('Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-gray-900">Review Moderation</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Comment</th>
                <th className="p-4">Visibility</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 font-medium">
                  <td className="p-4 font-bold">{r.customerName}</td>
                  <td className="p-4">{r.providerName}</td>
                  <td className="p-4 font-bold text-amber-500">⭐ {r.rating}</td>
                  <td className="p-4 max-w-xs truncate">"{r.comment}"</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${r.hidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {r.hidden ? 'Hidden' : 'Visible'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleHide(r.id)}
                      className={`px-3 py-1 font-bold rounded-lg text-xs ${r.hidden ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                      {r.hidden ? 'Unhide' : 'Hide Review'}
                    </button>
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
