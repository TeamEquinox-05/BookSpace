import axios from 'axios';
import { API_URL } from '../config/api-config.js';
import logger from './logger.js';

// Create custom axios instance for the API
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include credentials for CORS requests
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    // No custom headers that might trigger CORS preflight issues
  }
});

// Always check for token before making a request
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Generate unique request ID for log correlation
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// Add request interceptor for auth headers and logging
api.interceptors.request.use(
  config => {
    // Only add auth headers for protected endpoints (not auth-related ones)
    const authEndpoints = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-otp', '/auth/reset-password'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url.includes(endpoint));
    
    if (!isAuthEndpoint) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Store request ID in metadata
    const requestId = generateRequestId();
    
    // Store request start time for latency tracking
    config.metadata = { 
      startTime: Date.now(),
      requestId,
      isAuthEndpoint
    };
    
    // Log outgoing requests for debugging
    logger.api(`Request [${requestId}]: ${config.method.toUpperCase()} ${config.url}`, {
      endpoint: config.url,
      hasToken: !!config.headers.Authorization,
      isAuthEndpoint
    });
    
    return config;
  },
  error => {
    const requestId = generateRequestId();
    logger.error(`API Request setup error [${requestId}]:`, error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and token handling
api.interceptors.response.use(
  response => {
    // Calculate request duration
    const requestId = response.config.metadata?.requestId || 'unknown';
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : 'unknown';
    
    logger.api(`Response [${requestId}]: ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status} (${duration}ms)`, {
      endpoint: response.config.url,
      status: response.status,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(response.data).length
    });
    
    // Handle token in response - store it if present in login/signup responses
    if (response.config.url.includes('/auth/login') && response.data?.token) {
      logger.api(`[${requestId}] Token received in response, storing it`);
      localStorage.setItem('token', response.data.token);
    }
    
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
      logger.error(`Error Response [${requestId}]:`, error.response.data);
      
      // Special handling for different error types
      if (status === 400) {
        // Validation errors
        logger.warn(`Validation error [${requestId}] for ${endpoint}`);
      } else if (status === 401) {
        // Authentication errors
        logger.warn(`Authentication error [${requestId}] detected in API response`);
        
        // Only clear token for non-login/auth endpoints
        const authEndpoints = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-otp'];
        const isAuthEndpoint = authEndpoints.some(path => error.config.url.includes(path));
        
        if (!isAuthEndpoint) {
          logger.warn(`Clearing auth token due to 401 from non-auth endpoint [${requestId}]`);
          localStorage.removeItem('token');
        }
      } else if (status === 404) {
        logger.warn(`Endpoint not found [${requestId}]: ${endpoint}`);
      } else if (status === 500) {
        logger.error(`Server error [${requestId}] at ${endpoint}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      logger.error(`API Network Error [${requestId}]: No response received for ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      logger.error(`Request details [${requestId}]:`, {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
    } else {
      // Something happened in setting up the request
      logger.error(`API Request Setup Error [${requestId}]:`, error.message);
    }
    
    // Always reject the promise to let component handle the error
    return Promise.reject(error);
  }
);

export default api;