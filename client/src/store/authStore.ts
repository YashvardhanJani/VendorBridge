import { create } from 'zustand';
import api from '../services/api';
import type { UserRole } from '../utils/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('vb_user') || 'null'),
  token: localStorage.getItem('vb_token'),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('vb_token'),

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;

      localStorage.setItem('vb_token', token);
      localStorage.setItem('vb_user', JSON.stringify(user));

      set({ token, user, isAuthenticated: true, loading: false });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Invalid email or password';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  signup: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/signup', userData);
      const { token, user } = response.data;

      localStorage.setItem('vb_token', token);
      localStorage.setItem('vb_user', JSON.stringify(user));

      set({ token, user, isAuthenticated: true, loading: false });
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Signup failed';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      localStorage.setItem('vb_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (err) {
      // API interceptor will auto-clear localStorage and redirect if 401
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
