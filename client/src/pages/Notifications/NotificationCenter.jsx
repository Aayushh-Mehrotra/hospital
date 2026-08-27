import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Clock, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { notificationApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';

export const NotificationCenter = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, showToast } = useNotification();
  const [filter, setFilter] = useState('ALL');

  const filteredNotifications =
    filter === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            System clinical broadcasts, appointment alerts, pharmacy low-stock warnings, and test completion alerts.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllAsRead}>
          Mark All as Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filter === 'UNREAD' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread Alerts ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No notifications to display.
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isWarning = n.type === 'Warning' || n.type === 'Low Stock Alert';
            const isSuccess = n.type === 'Success';

            return (
              <div
                key={n._id}
                className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                  !n.isRead ? 'bg-primary-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                      isWarning
                        ? 'bg-amber-500 shadow-amber-500/20'
                        : isSuccess
                        ? 'bg-emerald-500 shadow-emerald-500/20'
                        : 'bg-primary-600 shadow-primary-500/20'
                    }`}
                  >
                    {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDate(n.createdAt, true)}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800 whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
