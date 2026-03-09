import axios from 'axios';
import { API_URL } from '../config/api-config.js';
import logger from './logger.js';

// Create custom axios instance for the API
// Uses relative URL (/api) to go through proxy, ensuring cookies work (same-origin)
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include credentials (cookies) for all requests
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Generate unique request ID for log correlation
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    // Store request ID in metadata
    const requestId = generateRequestId();
    
    // Store request start time for latency tracking
    config.metadata = { 
      startTime: Date.now(),
      requestId
    };
    
    // Log outgoing requests for debugging
    logger.api(`Request [${requestId}]: ${config.method.toUpperCase()} ${config.url}`);
    
    return config;
  },
  error => {
    const requestId = generateRequestId();
    logger.error(`API Request setup error [${requestId}]:`, error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    // Calculate request duration
    const requestId = response.config.metadata?.requestId || 'unknown';
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : 'unknown';
    
    logger.api(`Response [${requestId}]: ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status} (${duration}ms)`);
    
    return response;
  },
  error => {
    // Get request ID if it exists
    const requestId = error.config?.metadata?.requestId || 'unknown-request';
    
    // Better error categorization and logging
    if (error.response) {
      const status = error.response.status;
      const endpoint = error.config?.url || 'unknown-endpoint';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      logger.error(`API Error [${requestId}]: ${method} ${endpoint} - Status: ${status}`);
      
      if (status === 401) {
        logger.warn(`Authentication error [${requestId}] detected in API response`);
        // Clear cached user data on auth errors (except for login attempts)
        const authEndpoints = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-otp'];
        const isAuthEndpoint = authEndpoints.some(path => error.config.url.includes(path));
        if (!isAuthEndpoint) {
          localStorage.removeItem('userData');
          localStorage.removeItem('userDataTimestamp');
        }
      }
    } else if (error.request) {
      logger.error(`API Network Error [${requestId}]: No response received for ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    } else {
      logger.error(`API Request Setup Error [${requestId}]:`, error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;