import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.getNotifications()
      .then((data) => setNotifications(data.content || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">Updates regarding your bookings and services</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-slate-500" />
          Mark all read
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base mb-1">No notifications</h3>
          <p className="text-xs text-slate-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border transition-colors flex items-start justify-between gap-4 ${
                n.isRead ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-slate-900">{n.title}</h4>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                </div>
                <p className="text-xs text-slate-600">{n.message}</p>
                <span className="text-[10px] text-slate-400 block">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
