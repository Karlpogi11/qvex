import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Queue API
export const queueApi = {
  getAll: () => api.get('/queues'),
  getById: (id) => api.get(`/queues/${id}`),
  create: (data) => api.post('/queues', data),
  update: (id, data) => api.put(`/queues/${id}`, data),
  cancel: (id) => api.delete(`/queues/${id}`),
  callNext: (payload) => api.post('/queues/call-next', payload),
  complete: (queueId, duration) => api.post(`/queues/${queueId}/complete`, { duration }),
  getWaiting: () => api.get('/queues/waiting'),
  getByAppointment: () => api.get('/queues/appointments'),
  getCurrent: (csoId) => api.get(`/queues/current/${csoId}`),
};

// CSO API
export const csoApi = {
  getAll: () => api.get('/csos'),
  getById: (id) => api.get(`/csos/${id}`),
  create: (data) => api.post('/csos', data), // ✅ NOW WORKING
  update: (id, data) => api.put(`/csos/${id}`, data),
  delete: (id) => api.delete(`/csos/${id}`), // ✅ NOW WORKING
  getCurrentQueue: (id) => api.get(`/csos/${id}/current-queue`),
  updateStatus: (id, status) => api.patch(`/csos/${id}/status`, status),
};

// Settings API - ✅ FIXED
export const settingsApi = {
  getServiceTypes: () => api.get('/settings/service-types'),
  updateServiceTypes: (serviceTypes) => 
    api.post('/settings/service-types', { service_types: serviceTypes }), // ✅ FIXED: Changed from PUT to POST and fixed payload
};

// Statistics API
export const statsApi = {
  getDaily: () => api.get('/statistics/daily'),
  getCsoStats: (csoId) => api.get(`/statistics/cso/${csoId}`),
  getAverageWaitTime: () => api.get('/statistics/average-wait-time'),
};

export default api;