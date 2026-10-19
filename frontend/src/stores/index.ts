/**
 * ECG Health System - 状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ 用户状态 ============

interface User {
  username: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (username, token) => set({ user: { username, token }, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// ============ 分析状态 ============

interface AnalysisState {
  currentTaskId: string | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  result: unknown | null;
  error: string | null;
  setTaskId: (taskId: string) => void;
  setStatus: (status: AnalysisState['status']) => void;
  setResult: (result: unknown) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentTaskId: null,
  status: 'idle',
  result: null,
  error: null,
  setTaskId: (taskId) => set({ currentTaskId: taskId }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result, status: 'completed' }),
  setError: (error) => set({ error, status: 'failed' }),
  reset: () => set({ currentTaskId: null, status: 'idle', result: null, error: null }),
}));

// ============ 实时数据状态 ============

interface RealtimeState {
  isConnected: boolean;
  currentRhythm: string;
  heartRate: number | null;
  confidence: number;
  alert: {
    level: 'warning' | 'critical' | null;
    message: string | null;
  };
  setConnected: (connected: boolean) => void;
  updateData: (data: Partial<RealtimeState>) => void;
  setAlert: (level: 'warning' | 'critical' | null, message: string | null) => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  isConnected: false,
  currentRhythm: 'unknown',
  heartRate: null,
  confidence: 0,
  alert: { level: null, message: null },
  setConnected: (connected) => set({ isConnected: connected }),
  updateData: (data) => set(data),
  setAlert: (level, message) => set({ alert: { level, message } }),
  reset: () => set({
    isConnected: false,
    currentRhythm: 'unknown',
    heartRate: null,
    confidence: 0,
    alert: { level: null, message: null },
  }),
}));
