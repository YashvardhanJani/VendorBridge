import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import {
  Bell,
  Check,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ArrowRight,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, loading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 bg-emerald-50 rounded-full p-1" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 bg-amber-50 rounded-full p-1" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-600 bg-rose-50 rounded-full p-1" />;
      default:
        return <Info className="w-5 h-5 text-sky-600 bg-sky-50 rounded-full p-1" />;
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    toast.success('All notifications marked as read');
  };

  return (
    <div className="page-container space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">All Notifications</h1>
          <p className="text-sm text-surface-500 mt-1">
            Stay up to date with procurement approvals, quote submissions, and dispatch notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="btn btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto bg-white"
          >
            <Check className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* List content */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          <div className="h-12 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 card border border-surface-200 bg-white space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-50 flex items-center justify-center text-surface-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900 text-sm">All clear!</h3>
            <p className="text-xs text-surface-450 mt-1">
              You do not have any notification alerts at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-white border border-surface-200 overflow-hidden divide-y divide-surface-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={async () => {
                await markAsRead(notif.id);
                if (notif.link) navigate(notif.link);
              }}
              className={`p-4 flex gap-4 items-start cursor-pointer hover:bg-surface-50/50 transition-colors ${
                !notif.read ? 'bg-brand-50/15 font-semibold' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-sm font-bold text-surface-900 leading-snug">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-surface-400 font-medium whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-surface-550 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {notif.link && (
                <div className="shrink-0 self-center text-brand-600 hover:text-brand-700">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default NotificationList;
