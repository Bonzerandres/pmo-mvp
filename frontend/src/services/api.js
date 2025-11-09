import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error / timeout
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
      // handle forbidden separately if needed
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
  deleteTask: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`)
};

export const dashboardAPI = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getAlerts: (projectId = null) => {
    const url = projectId ? `/dashboard/alerts?projectId=${projectId}` : '/dashboard/alerts';
    return api.get(url);
  },
  getPortfolioSummary: () => api.get('/dashboard/portfolio-summary')
};

export default api;

