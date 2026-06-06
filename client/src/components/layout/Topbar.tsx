import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import {
  Menu,
  Bell,
  ChevronRight,
  LogOut,
  User,
  Check,
  Info,
  AlertTriangle,
  XCircle,
  Mail,
  UserCheck
} from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple Breadcrumbs mapping
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbLabel = (part: string, index: number) => {
    // If it's a UUID, return generic detail label
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part) || part.length > 20;
    if (isUuid) return 'Detail';

    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      vendors: 'Vendors',
      rfqs: 'RFQs',
      quotations: 'Quotations',
      approvals: 'Approvals',
      'purchase-orders': 'Purchase Orders',
      invoices: 'Invoices',
      'activity-logs': 'Activity Logs',
      reports: 'Reports',
    };
    return labels[part] || part.charAt(0).toUpperCase() + part.slice(1);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-accent-600 bg-accent-50 rounded-full p-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning-600 bg-warning-50 rounded-full p-0.5" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-danger-600 bg-danger-50 rounded-full p-0.5" />;
      default:
        return <Info className="w-4 h-4 text-brand-600 bg-brand-50 rounded-full p-0.5" />;
    }
  };

  return (
    <header className="h-[var(--topbar-height)] sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-200 px-6 flex items-center justify-between">
      {/* Left side: Mobile menu & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-surface-500 hover:text-surface-900 hover:bg-surface-50 rounded-xl transition-all duration-200 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          <Link
            to="/dashboard"
            className="text-surface-500 hover:text-brand-600 font-medium transition-colors"
          >
            Home
          </Link>
          {pathnames.map((part, index) => {
            const path = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const label = getBreadcrumbLabel(part, index);

            return (
              <React.Fragment key={path}>
                <ChevronRight className="w-4 h-4 text-surface-300" />
                {isLast ? (
                  <span className="text-surface-800 font-semibold">{label}</span>
                ) : (
                  <Link
                    to={path}
                    className="text-surface-500 hover:text-brand-600 font-medium transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right side: Notifications & User profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-surface-500 hover:text-surface-900 hover:bg-surface-50 rounded-xl transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-danger-500 text-white text-[9px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-surface-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-surface-150 flex items-center justify-between">
                <span className="font-bold text-surface-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-surface-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-surface-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) navigate(notif.link);
                        setShowNotifications(false);
                      }}
                      className={`p-3.5 flex gap-3 cursor-pointer hover:bg-surface-50 transition-colors ${
                        !notif.read ? 'bg-brand-50/20' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-surface-900 leading-snug">
                          {notif.title}
                        </div>
                        <div className="text-[11px] text-surface-500 line-clamp-2 mt-0.5">
                          {notif.message}
                        </div>
                        <div className="text-[10px] text-surface-400 mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2.5 bg-surface-50 border-t border-surface-150 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors inline-block"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-surface-50 rounded-xl transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {user?.name.charAt(0)}
            </div>
          </button>

          {/* User Menu Dropdown Panel */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white border border-surface-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5">
              <div className="px-4 py-3 border-b border-surface-150">
                <p className="text-xs font-medium text-surface-400">Signed in as</p>
                <p className="text-sm font-semibold text-surface-800 truncate">{user?.name}</p>
                <p className="text-xs text-surface-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-danger-600 hover:bg-danger-50 text-sm font-medium transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
