// API Configuration
// In development: uses relative /api path, proxied by Vite to localhost:10000
// In production: set VITE_API_URL env var to your backend URL, e.g. https://your-backend.onrender.com/api

/**
 * API base URL. Set VITE_API_URL in production.
 * Defaults to /api which is proxied by Vite during local development.
 */
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiUrl = async () => API_URL;

/**
 * Base URL for static assets (images). Derived from VITE_API_URL.
 * Returns empty string in local dev so /api/places/image/... paths are proxied by Vite.
 */
export const getBackendBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  return '';
};
