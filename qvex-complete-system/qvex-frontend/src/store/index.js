import { create } from 'zustand';
import { settingsApi } from '../services/api';

// Main app store
export const useAppStore = create((set, get) => ({
  // Theme
  theme: localStorage.getItem('theme') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  // Settings - ✅ REMOVED hardcoded values
  settings: {
    serviceTypes: [], // Will be loaded from backend
    csos: [],
  },
  updateSettings: (settings) => set({ settings: { ...get().settings, ...settings } }),

  // ✅ NEW: Load settings from backend
  loadSettings: async () => {
    try {
      const serviceTypes = await settingsApi.getServiceTypes();
      set((state) => ({
        settings: {
          ...state.settings,
          serviceTypes: serviceTypes || [],
        }
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Fallback to defaults if API fails
      set((state) => ({
        settings: {
          ...state.settings,
          serviceTypes: ['Repair', 'Courtesy', 'Releasing', 'Payment', 'Other'],
        }
      }));
    }
  },

  // Queue Management
  queues: [],
  currentDisplay: [],
  setQueues: (queues) => set({ queues }),
  addQueue: (queue) => set((state) => ({ queues: [...state.queues, queue] })),
  updateQueue: (id, updates) => set((state) => ({
    queues: state.queues.map((q) => (q.id === id ? { ...q, ...updates } : q))
  })),
  removeQueue: (id) => set((state) => ({
    queues: state.queues.filter((q) => q.id !== id)
  })),

  // CSO Management
  csos: [],
  setCsos: (csos) => set({ csos }),
  updateCsoStatus: (csoId, status) => set((state) => ({
    csos: state.csos.map((cso) => 
      cso.id === csoId ? { ...cso, ...status } : cso
    )
  })),

  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
}));

// CSO specific store
export const useCsoStore = create((set, get) => ({
  queuesByCso: {},
  serviceDurationByCso: {},
  serviceStartTimeByCso: {},

  startService: (csoId, queue, elapsedSeconds = 0) => {
    const now = Date.now();
    const startTime = now - elapsedSeconds * 1000;
    set((state) => ({
      queuesByCso: { ...state.queuesByCso, [csoId]: queue },
      serviceDurationByCso: { ...state.serviceDurationByCso, [csoId]: elapsedSeconds },
      serviceStartTimeByCso: { ...state.serviceStartTimeByCso, [csoId]: startTime },
    }));
  },

  updateDuration: (csoId) => {
    const start = get().serviceStartTimeByCso?.[csoId];
    if (start) {
      const duration = Math.floor((Date.now() - start) / 1000);
      set((state) => ({
        serviceDurationByCso: { ...state.serviceDurationByCso, [csoId]: duration },
      }));
    }
  },

  getCurrentQueue: (csoId) => get().queuesByCso?.[csoId] || null,

  getServiceDuration: (csoId) => get().serviceDurationByCso?.[csoId] || 0,

  completeService: (csoId) => {
    set((state) => {
      const queues = { ...state.queuesByCso };
      const durations = { ...state.serviceDurationByCso };
      const startTimes = { ...state.serviceStartTimeByCso };
      delete queues[csoId];
      delete durations[csoId];
      delete startTimes[csoId];
      return {
        queuesByCso: queues,
        serviceDurationByCso: durations,
        serviceStartTimeByCso: startTimes,
      };
    });
  },
}));