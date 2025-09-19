import { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import axios from 'axios';

// Define base URL for API
const API_BASE_URL = 'https://bookspace-be.onrender.com/api';

// Define shared config for consistent timeout settings
const API_CONFIG = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000, // 60 second timeout for very slow connections (Render free tier can be slow on cold starts)
  headers: {
    'Content-Type': 'application/json'
  }
};

// Create custom axios instance for the API with the shared config
const api = axios.create(API_CONFIG);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup axios and API configuration
  useEffect(() => {
    console.log('Setting up API and authentication configuration');
    
    // Apply the same config to global axios instance
    axios.defaults.timeout = API_CONFIG.timeout;
    
    // Get authentication token from storage
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? 'Found' : 'Not found');
    
    if (token) {
      console.log('Found token in localStorage, configuring auth headers');
      const authHeader = `Bearer ${token}`;
      
      // Add token to both axios instances
      api.defaults.headers.common['Authorization'] = authHeader;
      axios.defaults.headers.common['Authorization'] = authHeader;
      
      console.log('Initial setup: Auth headers configured with timeout:', API_CONFIG.timeout);
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
    
    // Check for stored user data to enable offline mode
    const storedUser = localStorage.getItem('userData');
    let cachedUser = null;
    
    if (storedUser) {
      try {
        cachedUser = JSON.parse(storedUser);
        console.log('Found cached user data:', cachedUser.name);
      } catch (e) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('userData');
      }
    }
    
    try {
      // Set a short timeout to avoid blocking the UI
      const controller = new AbortController();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Backend connection timed out')), 10000); // Fail fast
      });
      
      // Race between the fetch request and the timeout
      console.log('Fetching user data...');
      const res = await Promise.race([
        api.get('/users/me'),
        timeoutPromise
      ]);
      
      console.log('User data received successfully');
      setUser(res.data);
      
      // Cache the user data for offline access
      localStorage.setItem('userData', JSON.stringify(res.data));
      
      return true; // Success
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // If we have cached user data, use it in offline mode
      if (cachedUser) {
        console.log('Using cached user data for offline mode');
        setUser(cachedUser);
        return true; // Continue with cached data
      }
      
      // Special handling based on error type
      if (error.code === 'ECONNABORTED' || error.message === 'Backend connection timed out') {
        console.warn('Connection timeout. Server may be down or network issues.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        console.log('Server responded with status:', error.response.status);
        
        if (error.response.status === 401) {
          // Unauthorized - clear any stored token as it's invalid
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.warn('No response received from server');
      }
      
      setUser(null);
      return false; // Failed to authenticate
    } finally {
      setLoading(false);
    }
  };

  // On initial load, try to fetch user data or use cached data
  useEffect(() => {
    // Try to load cached user data immediately to prevent UI blocking
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const cachedUser = JSON.parse(storedUser);
        setUser(cachedUser);
        console.log('Temporarily using cached user data while refreshing');
      } catch (e) {
        console.error('Failed to parse stored user data');
      }
    }
    
    // Then attempt to refresh from server
    const attemptRefresh = async () => {
      const success = await refreshUser();
      
      if (!success) {
        console.log('Using offline mode. Some features may be limited.');
        // We're already showing the cached user if available, so no additional action needed
      }
    };
    
    attemptRefresh();
  }, []);

  // Login function with improved token handling and offline support
  const login = (userData, token) => {
    console.log('Login: Setting user data and token');
    console.log('Login: Token received:', token ? 'Yes' : 'No');
    setUser(userData);
    
    // Always cache the user data for offline access
    if (userData) {
      console.log('Login: Storing user data in localStorage for offline access');
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    
    // If we receive a token, store it
    if (token) {
      console.log('Login: Storing auth token in localStorage with key "token"');
      localStorage.setItem('token', token);
      
      // Set the token for both axios instances immediately
      const authHeader = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = authHeader;
      axios.defaults.headers.common['Authorization'] = authHeader;
      
      console.log('Login: Auth headers set for both axios instances');
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
      
      // Clear any stored tokens and user data
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
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