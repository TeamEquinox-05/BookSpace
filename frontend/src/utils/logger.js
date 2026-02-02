/**
 * Logger utility for BookSpace frontend
 * Provides environment-aware logging that reduces noise in production
 */

const isDevelopment = import.meta.env.DEV;

const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log warning messages (always)
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log error messages (always)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log API request/response info (only in development)
   */
  api: (message, ...args) => {
    if (isDevelopment) {
      console.log('[API]', message, ...args);
    }
  },

  /**
   * Log authentication events (only in development)
   */
  auth: (message, ...args) => {
    if (isDevelopment) {
      console.log('[AUTH]', message, ...args);
    }
  }
};

export default logger;
