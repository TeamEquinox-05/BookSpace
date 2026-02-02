// API Configuration
// This file contains the centralized API URL configuration used across the application

import logger from '../utils/logger';

/**
 * Get the API base URL
 * In production: use Render backend
 * In development: try localhost first, fallback to Render if localhost is not available
 */
export const getApiUrl = async () => {
  if (import.meta.env.PROD) {
    return 'https://bookspace-be.onrender.com/api';
  }
  
  // In development, check if local backend is running
  try {
    const response = await fetch('http://localhost:10000/api/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    
    if (response.ok) {
      logger.api('Using local backend at http://localhost:10000/api');
      return 'http://localhost:10000/api';
    }
  } catch {
    logger.warn('Local backend not available, falling back to Render backend');
  }
  
  return 'https://bookspace-be.onrender.com/api';
};

/**
 * Synchronous API URL for immediate use
 * In production: use Render backend
 * In development: use localhost (no fallback)
 */
export const API_URL = import.meta.env.PROD 
  ? 'https://bookspace-be.onrender.com/api'
  : 'http://localhost:10000/api';
