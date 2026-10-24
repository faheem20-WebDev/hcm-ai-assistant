import axios from 'axios';
import mockAdapter from './mockApi';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

if (import.meta.env.VITE_USE_MOCK === 'true') {
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hcm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hcm_token');
      localStorage.removeItem('hcm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
