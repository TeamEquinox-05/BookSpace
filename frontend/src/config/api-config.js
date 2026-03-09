// API Configuration
// Uses relative URL to leverage proxy (Vite in dev, Vercel rewrites in prod)
// This ensures cookies work correctly (same-origin) and avoids CORS issues

import logger from '../utils/logger';

/**
 * Get the API base URL (async - for cases needing fallback detection)
 */
export const getApiUrl = async () => {
  return '/api';
};

/**
 * Synchronous API URL for immediate use
 * Uses relative path to go through the proxy layer
 */
export const API_URL = '/api';

/**
 * Get the backend base URL (without /api) for static assets like images
 */
export const getBackendBaseUrl = () => {
  if (import.meta.env.PROD) {
    return 'https://bookspace-be.onrender.com';
  }
  return 'http://localhost:10000';
};
