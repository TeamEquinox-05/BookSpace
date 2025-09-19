import { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import axios from 'axios';

// Define base URL for API
const API_BASE_URL = 'https://bookspace-be.onrender.com/api';

// Create custom axios instance for the API
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout for very slow connections
  headers: {
    'Content-Type': 'application/json'
  },
  // Add retry logic
  retryDelay: 1000,
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup axios and API configuration
  useEffect(() => {
    console.log('Setting up API and authentication configuration');
    
    // Get authentication token from storage
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? 'Found' : 'Not found');
    
    if (token) {
      console.log('Found token in localStorage, configuring auth headers');
      const authHeader = `Bearer ${token}`;
      
      // Add token to both axios instances
      api.defaults.headers.common['Authorization'] = authHeader;
      axios.defaults.headers.common['Authorization'] = authHeader;
      
      console.log('Initial setup: Auth headers configured');
    } else {
      console.log('No token found in localStorage on initial setup');
    }
    
    // Add request interceptor for logging
    api.interceptors.request.use(
      config => {
        // Log outgoing requests for debugging
        console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
        return config;
      },
      error => {
        console.error('Request error:', error.message);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor to handle errors
    api.interceptors.response.use(
      response => {
        console.log('API response successful:', response.config.url);
        return response;
      },
      error => {
        console.error(`API Error (${error.config?.url || 'unknown endpoint'}):`, error.message);
        
        // Handle authentication errors specially
        if (error.response?.status === 401) {
          console.log('Authentication error detected, clearing auth data');
          localStorage.removeItem('token');
        }
        
        return Promise.reject(error);
      }
    );
  }, []);

  const refreshUser = async () => {
    console.log('Starting user data refresh...');
    try {
      // First, check if API is reachable with a simple health check
      try {
        // Using a direct fetch with a short timeout to quickly check if the API is accessible
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
        
        // Attempt a basic connection to the API
        const healthCheck = await fetch(`${API_BASE_URL}/auth/health`, {
          signal: controller.signal,
          method: 'HEAD' // Just check connection, don't need response body
        });
        
        clearTimeout(timeoutId);
        console.log('API health check successful');
      } catch (healthErr) {
        console.warn('API health check failed, will still try to authenticate:', healthErr.message);
      }
      
      // Try to get user data with token (if available)
      const token = localStorage.getItem('token');
      
      // Set authorization header if token exists
      const options = {};
      if (token) {
        options.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      console.log('Fetching user data...');
      const res = await api.get('/users/me', options);
      console.log('User data received successfully');
      setUser(res.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // Special handling based on error type
      if (error.code === 'ECONNABORTED') {
        console.warn('Connection timeout. Server may be down or network issues.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        console.log('Server responded with status:', error.response.status);
        
        if (error.response.status === 401) {
          // Unauthorized - clear any stored token as it's invalid
          localStorage.removeItem('token');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.warn('No response received from server');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On initial load, try to fetch user data with retry logic if server is temporarily down
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2; // Maximum number of retries
    
    const attemptRefresh = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error(`Authentication attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = retryCount * 3000; // Increasing delay: 3s, 6s
          console.log(`Retrying authentication in ${delay/1000}s...`);
          
          setTimeout(attemptRefresh, delay);
        } else {
          console.log('Max retries reached. User must login manually.');
          setLoading(false);
        }
      }
    };
    
    attemptRefresh();
  }, []);

  // Login function with improved token handling
  const login = (userData, token) => {
    console.log('Login: Setting user data and token');
    console.log('Login: Token received:', token ? 'Yes' : 'No');
    setUser(userData);
    
    // If we receive a token, store it
    if (token) {
      console.log('Login: Storing auth token in localStorage with key "token"');
      localStorage.setItem('token', token);
      
      // Set the token for both axios instances immediately
      const authHeader = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = authHeader;
      axios.defaults.headers.common['Authorization'] = authHeader;
      
      console.log('Login: Auth headers set for both axios instances');
      console.log('Login: axios.defaults.headers.common.Authorization =', axios.defaults.headers.common['Authorization']);
    } else {
      console.warn('Login: No token received from backend');
    }
  };

  // Enhanced logout function with multiple approaches
  const logout = async () => {
    console.log('Logout: Starting...');
    try {
      // Try multiple approaches to ensure logout succeeds
      try {
        // First try with custom API instance
        await api.post('/auth/logout');
        console.log('Logout: Successfully called backend logout endpoint with API instance');
      } catch (apiError) {
        console.error('Logout with API instance failed:', apiError.message);
        
        // If that fails, try direct approach
        await axios.post('https://bookspace-be.onrender.com/api/auth/logout', {}, { 
          withCredentials: true 
        });
        console.log('Logout: Successfully called backend logout with direct request');
      }
    } catch (err) {
      console.error('Logout: All backend logout attempts failed:', err.message);
      // Continue with frontend cleanup even if backend call fails
    } finally {
      // Clean up all authentication data
      console.log('Logout: Cleaning up frontend auth state');
      
      // Clear user state
      setUser(null);
      
      // Clear any stored tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Clear Authorization headers
      delete api.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
      
      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Logout: Completed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);