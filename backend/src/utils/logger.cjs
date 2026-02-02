/**
 * Logger utility for BookSpace backend
 * Provides environment-aware logging that reduces noise in production
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args) => {
    if (!isProduction) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (!isProduction) {
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
   * Log important messages that should appear in production too
   * Use sparingly for critical operational info
   */
  important: (...args) => {
    console.log('[IMPORTANT]', ...args);
  },

  /**
   * Log request information (only in development)
   */
  request: (method, path, origin) => {
    if (!isProduction) {
      console.log(`[REQUEST] ${method} ${path} - Origin: ${origin || 'none'}`);
    }
  },

  /**
   * Log authentication events (sanitized in production)
   */
  auth: (message, email) => {
    if (isProduction) {
      // In production, don't log email addresses
      console.log(`[AUTH] ${message}`);
    } else {
      console.log(`[AUTH] ${message}`, email ? `for: ${email}` : '');
    }
  }
};

module.exports = logger;
