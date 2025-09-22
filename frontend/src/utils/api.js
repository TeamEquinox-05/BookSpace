import axios from 'axios';

// Backend URLs
const LOCAL_API_URL = 'http://localhost:10000/api';
const REMOTE_API_URL = 'https://bookspace-be.onrender.com/api';

// Function to detect if local backend is running
const checkLocalBackend = async () => {
  try {
    // Try multiple endpoints to detect local backend
    const endpoints = [
      `${LOCAL_API_URL}/health`,
      `${LOCAL_API_URL}/stats` // fallback endpoint that might exist
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { 
          timeout: 1500,
          withCredentials: false 
        });
        if (response.status === 200) {
          console.log(`Local backend detected via: ${endpoint}`);
          return true;
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

// Function to get the appropriate base URL
const getBaseURL = async () => {
  // Cache the result for a short time to avoid repeated checks
  if (!getBaseURL.cache || Date.now() - getBaseURL.cacheTime > 30000) { // 30 seconds cache
    const isLocalRunning = await checkLocalBackend();
    getBaseURL.cache = isLocalRunning ? LOCAL_API_URL : REMOTE_API_URL;
    getBaseURL.cacheTime = Date.now();
    console.log(`Using ${isLocalRunning ? 'LOCAL' : 'REMOTE'} backend: ${getBaseURL.cache}`);
  }
  return getBaseURL.cache;
};

// Create custom axios instance for the API
const api = axios.create({
  baseURL: REMOTE_API_URL, // Default to remote, will be updated dynamically
  withCredentials: true, // Always include credentials for CORS requests
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    // No custom headers that might trigger CORS preflight issues
  }
});

// Smart request function that tries local first, then remote
const smartRequest = async (config) => {
  // First, try with automatic detection
  try {
    const baseURL = await getBaseURL();
    config.baseURL = baseURL;
    config.withCredentials = baseURL.includes('localhost') ? false : true;
    
    return await originalRequest.call(api, config);
  } catch (error) {
    // If detection failed or request failed, try both endpoints
    console.warn('Smart detection failed, trying fallback approach');
    
    const endpoints = [
      { url: LOCAL_API_URL, credentials: false },
      { url: REMOTE_API_URL, credentials: true }
    ];
    
    let lastError = error;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint.url}`);
        config.baseURL = endpoint.url;
        config.withCredentials = endpoint.credentials;
        
        const response = await originalRequest.call(api, config);
        console.log(`Success with endpoint: ${endpoint.url}`);
        
        // Update cache for future requests
        getBaseURL.cache = endpoint.url;
        getBaseURL.cacheTime = Date.now();
        
        return response;
      } catch (endpointError) {
        console.warn(`Failed with endpoint ${endpoint.url}:`, endpointError.message);
        lastError = endpointError;
      }
    }
    
    throw lastError;
  }
};

// Override the request method
const originalRequest = api.request;
api.request = smartRequest;

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
    
    // Store request ID in metadata but don't add as header to avoid CORS issues
    const requestId = generateRequestId();
    // Don't add custom headers that might trigger CORS preflight issues
    // config.headers['X-Request-ID'] = requestId;
    
    // Store request start time for latency tracking
    config.metadata = { 
      startTime: Date.now(),
      requestId,
      isAuthEndpoint
    };
    
    // Log outgoing requests for debugging
    console.log(`API Request [${requestId}]: ${config.method.toUpperCase()} ${config.url}`, {
      endpoint: config.url,
      hasToken: !!config.headers.Authorization,
      isAuthEndpoint
    });
    
    return config;
  },
  error => {
    const requestId = error.config?.headers?.['X-Request-ID'] || generateRequestId();
    console.error(`API Request setup error [${requestId}]:`, error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and token handling
api.interceptors.response.use(
  response => {
    // Calculate request duration
    const requestId = response.config.headers['X-Request-ID'] || 'unknown';
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : 'unknown';
    
    console.log(`API Response [${requestId}]: ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status} (${duration}ms)`, {
      endpoint: response.config.url,
      status: response.status,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(response.data).length
    });
    
    // Handle token in response - store it if present in login/signup responses
    if (response.config.url.includes('/auth/login') && response.data?.token) {
      console.log(`[${requestId}] Token received in response, storing it`);
      localStorage.setItem('token', response.data.token);
    }
    
    return response;
  },
  error => {
    // Get request ID if it exists
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown-request';
    
    // Better error categorization and logging
    if (error.response) {
      const status = error.response.status;
      const endpoint = error.config?.url || 'unknown-endpoint';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      console.error(`API Error [${requestId}]: ${method} ${endpoint} - Status: ${status}`);
      console.error(`Error Response [${requestId}]:`, error.response.data);
      
      // Special handling for different error types
      if (status === 400) {
        // Validation errors
        console.warn(`Validation error [${requestId}] for ${endpoint}`);
      } else if (status === 401) {
        // Authentication errors
        console.warn(`Authentication error [${requestId}] detected in API response`);
        
        // Only clear token for non-login/auth endpoints
        const authEndpoints = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-otp'];
        const isAuthEndpoint = authEndpoints.some(path => error.config.url.includes(path));
        
        if (!isAuthEndpoint) {
          console.warn(`Clearing auth token due to 401 from non-auth endpoint [${requestId}]`);
          localStorage.removeItem('token');
        }
      } else if (status === 404) {
        console.warn(`Endpoint not found [${requestId}]: ${endpoint}`);
      } else if (status === 500) {
        console.error(`Server error [${requestId}] at ${endpoint}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`API Network Error [${requestId}]: No response received for ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error(`Request details [${requestId}]:`, {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
    } else {
      // Something happened in setting up the request
      console.error(`API Request Setup Error [${requestId}]:`, error.message);
    }
    
    // Always reject the promise to let component handle the error
    return Promise.reject(error);
  }
);

export default api;