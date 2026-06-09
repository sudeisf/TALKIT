import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true, // <--- CRITICAL: Ensures cookies are sent/received
});

// Add this Interceptor to automatically add the CSRF Header
API.interceptors.request.use((config) => {
  // 1. Helper function to read the 'csrftoken' cookie
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null; // Handle Server-Side Rendering
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  // 2. Get the token
  const token = getCookie('csrftoken');

  // 3. If token exists, add it to the headers
  if (token) {
    config.headers['X-CSRFToken'] = token;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;