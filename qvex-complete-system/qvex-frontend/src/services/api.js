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
  cancel: (queueId) => api.post(`/queues/${queueId}/cancel`),
  callNext: (payload) => api.post('/queues/call-next', payload),
  complete: (queueId, duration) => api.post(`/queues/${queueId}/complete`, { duration }),
  getWaiting: () => api.get('/queues/waiting'),
  getByAppointment: () => api.get('/queues/appointments'),
  getCurrent: (csoId) => axios.get(`/queues/current/${csoId}`).then(res => res.data),
};

// CSO API
export const csoApi = {
  getAll: () => api.get('/csos'),
  getById: (id) => api.get(`/csos/${id}`),
  create: (data) => api.post('/csos', data),
  update: (id, data) => api.put(`/csos/${id}`, data),
 cancel: (queueId) => api.post(`/queues/queues/${queueId}/cancel`),
  getCurrentQueue: (id) => api.get(`/csos/${id}/current-queue`),
  updateStatus: (id, status) => api.patch(`/csos/${id}/status`, status),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  getServiceTypes: () => api.get('/settings/service-types'),
  updateServiceTypes: (types) => api.put('/settings/service-types', { types }),
};

// Statistics API
export const statsApi = {
  getDaily: () => api.get('/statistics/daily'),
  getCsoStats: (csoId) => api.get(`/statistics/cso/${csoId}`),
  getAverageWaitTime: () => api.get('/statistics/average-wait-time'),
};

export default api;
