import { create } from 'zustand';
import api from '../services/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/notifications');
      const notifications = response.data.notifications || [];
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      // Fallback to static mock notifications if endpoint doesn't exist yet
      const mocks: Notification[] = [
        {
          id: 'n1',
          userId: 'u1',
          title: 'Welcome to VendorBridge',
          message: 'Your account setup has been completed successfully.',
          type: 'success',
          read: false,
          link: '/dashboard',
          createdAt: new Date().toISOString(),
        },
      ];
      set({ notifications: mocks, unreadCount: 1, loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      // ignore
    }
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    const unreadCount = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount });
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      // ignore
    }
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },
}));
