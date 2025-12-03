import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json'
  }
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ message: 'Network error or server is unreachable', original: error });
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ message: 'Request timeout', original: error });
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      return Promise.reject({ message: 'You do not have permission to perform this action', original: error });
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me')
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMetrics: (id) => api.get(`/projects/${id}/metrics`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (projectId, taskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  deleteTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  markComplete: (id, notes) => api.post(`/projects/${id}/complete`, { completion_notes: notes }),
  getCompleted: (filters) => api.get('/projects/completed', { params: filters })
};

export const dashboardAPI = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getAlerts: (projectId = null) => {
    const url = projectId ? `/dashboard/alerts?projectId=${projectId}` : '/dashboard/alerts';
    return api.get(url);
  },
  getPortfolioSummary: () => api.get('/dashboard/portfolio-summary'),

  getWeeklyTrends: (params) => api.get('/dashboard/weekly-trends', { params }),
  getCurrentWeek: () => api.get('/dashboard/current-week'),
  getCompletionAnalytics: () => api.get('/dashboard/completion-analytics')
};

export const calendarAPI = {
  getCalendarData: (projectId, params) =>
    api.get(`/calendar/projects/${projectId}/calendar`, { params }),
  getWeeklySummary: (projectId, params) =>
    api.get(`/calendar/projects/${projectId}/calendar/summary`, { params }),
  getTaskSnapshots: (projectId, taskId, params) =>
    api.get(`/calendar/projects/${projectId}/tasks/${taskId}/snapshots`, { params }),
  createSnapshot: (projectId, taskId, data) =>
    api.post(`/calendar/projects/${projectId}/tasks/${taskId}/snapshots`, data),
  updateSnapshot: (id, data) =>
    api.put(`/calendar/snapshots/${id}`, data),
  deleteSnapshot: (id) =>
    api.delete(`/calendar/snapshots/${id}`),
  bulkCreateSnapshots: (projectId, data) =>
    api.post(`/calendar/projects/${projectId}/snapshots/bulk`, data)
};

export default api;

