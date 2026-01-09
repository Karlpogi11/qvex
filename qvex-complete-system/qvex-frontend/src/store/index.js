import { create } from 'zustand';

// Main app store
export const useAppStore = create((set, get) => ({
  // Theme
  theme: localStorage.getItem('theme') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  // Settings
  settings: {
    serviceTypes: ['Screen Repair', 'Battery Replacement', 'Water Damage', 'Software Issue', 'General Checkup', 'Other'],
    csos: [],
  },
  updateSettings: (settings) => set({ settings: { ...get().settings, ...settings } }),

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
  currentQueue: null,
  serviceStartTime: null,
  serviceDuration: 0,
  
  startService: (queue) => {
    set({
      currentQueue: queue,
      serviceStartTime: Date.now(),
      serviceDuration: 0,
    });
  },

  updateDuration: () => {
    const { serviceStartTime } = get();
    if (serviceStartTime) {
      set({ serviceDuration: Math.floor((Date.now() - serviceStartTime) / 1000) });
    }
  },

  completeService: () => {
    set({
      currentQueue: null,
      serviceStartTime: null,
      serviceDuration: 0,
    });
  },
}));
