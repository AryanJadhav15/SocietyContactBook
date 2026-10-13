import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api'),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const csrf = localStorage.getItem('csrfToken');
  if (csrf && !['get', 'head', 'options'].includes(config.method)) {
    config.headers['x-csrf-token'] = csrf;
  }
  return config;
});

export function unwrap(response) {
  return response.data.data;
}
