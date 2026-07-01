import axios from 'axios';
import { getApiBaseUrl } from './config';

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alzalert_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('alzalert_token');
      localStorage.removeItem('alzalert_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
