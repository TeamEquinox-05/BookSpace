import { createContext, useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import axios from 'axios';

// Define base URL for API - use environment variable with fallback
// In Vite, environment variables are accessed via import.meta.env
// The variable must be prefixed with VITE_ to be exposed to the client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bookspace-be.onrender.com/api';

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
// This is the ONLY axios instance used throughout the auth context
const api = axios.create(API_CONFIG);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to track login verification timeout for cleanup
  const loginVerifyTimeoutRef = useRef(null);

  // Setup axios and API configuration
  useEffect(() => {
    console.log('Setting up API and authentication configuration');
    
    // Get authentication token from storage
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? `Found (length: ${token.length})` : 'Not found');
    
    if (token) {
      console.log('Found token in localStorage, configuring auth headers');
      
      try {
        // Validate token format (simple check - doesn't validate with server)
        if (token.length < 10) {
          console.warn('Token appears invalid (too short), clearing it');
          localStorage.removeItem('token');
          return;
        }
        
        const authHeader = `Bearer ${token}`;
        
        // Add token to the api instance
        api.defaults.headers.common['Authorization'] = authHeader;
        
        console.log('Initial setup: Auth headers configured');
        
      } catch (error) {
        console.error('Error setting up authentication:', error);
        localStorage.removeItem('token');
      }
    } else {
      console.log('No token found in localStorage on initial setup');
      // Clear any existing auth headers just to be safe
      delete api.defaults.headers.common['Authorization'];
    }
    
    // Add request interceptor for logging
    const requestInterceptor = api.interceptors.request.use(
      config => {
        // Log outgoing requests for debugging
        console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
        
        // For non-authentication endpoints, ensure we have the latest token
        if (config.url?.includes('/auth/') === false) {
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            config.headers['Authorization'] = `Bearer ${currentToken}`;
          }
        }
        
        return config;
      },
      error => {
        console.error('Request error:', error.message);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor to handle errors
    const responseInterceptor = api.interceptors.response.use(
      response => {
        console.log('API response successful:', response.config.url);
        return response;
      },
      error => {
        console.error(`API Error (${error.config?.url || 'unknown endpoint'}):`, error.message);
        
        // Handle authentication errors specially
        if (error.response?.status === 401) {
          console.log('Authentication error detected, clearing auth data');
          
          // Don't clear token for login attempts
          if (!error.config.url.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Cleanup interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const refreshUser = async () => {
    console.log('Starting user data refresh...');
    
    // Check for stored token first - if no token, don't even try to refresh
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.log('No authentication token found, skipping refresh');
      setLoading(false);
      setUser(null);
      return false;
    }
    
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
      // Make sure the token is in the headers
      const authHeader = `Bearer ${storedToken}`;
      api.defaults.headers.common['Authorization'] = authHeader;
      
      // Set a short timeout to avoid blocking the UI
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Backend connection timed out')), 10000); // Fail fast
      });
      
      // Race between the fetch request and the timeout
      console.log('Fetching user data with token...');
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
      
      // Special handling based on error type
      if (error.code === 'ECONNABORTED' || error.message === 'Backend connection timed out') {
        console.warn('Connection timeout. Server may be down or network issues.');
        
        // If we have cached user data, use it in offline mode for timeouts
        if (cachedUser) {
          console.log('Using cached user data due to timeout');
          setUser(cachedUser);
          return true; // Continue with cached data
        }
      } else if (error.response) {
        // The request was made and the server responded with a status code
        console.log('Server responded with status:', error.response.status);
        
        if (error.response.status === 401 || error.response.status === 403) {
          // Unauthorized/Forbidden - clear any stored token as it's invalid
          console.log('Authentication error detected, clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setUser(null);
          
          // Don't use cached data for auth errors
          return false;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.warn('No response received from server');
        
        // For network errors, we can use cached data
        if (cachedUser) {
          console.log('Using cached user data due to network error');
          setUser(cachedUser);
          return true; // Continue with cached data
        }
      }
      
      // If we have cached user data as a fallback for other errors
      if (cachedUser) {
        console.log('Using cached user data as fallback');
        setUser(cachedUser);
        return true; // Continue with cached data
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
    
    if (!userData || !token) {
      console.error('Login failed: Missing user data or token');
      return;
    }
    
    console.log(`Login: Token received (length: ${token.length})`);
    
    try {
      // Store the user in state
      setUser(userData);
      
      // Always cache the user data for offline access
      console.log('Login: Storing user data in localStorage');
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Store token in localStorage
      console.log('Login: Storing auth token in localStorage');
      localStorage.setItem('token', token);
      
      // Set the token for the api instance
      const authHeader = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = authHeader;
      
      // Verify the headers are set correctly
      console.log('Login: Auth headers set for API instance');
      console.log('Login: Authorization header:', api.defaults.headers.common['Authorization'] ? 'Set' : 'Not set');
      
      // Clear any previous verification timeout
      if (loginVerifyTimeoutRef.current) {
        clearTimeout(loginVerifyTimeoutRef.current);
      }
      
      // Test if the token works by making a simple authenticated request
      loginVerifyTimeoutRef.current = setTimeout(async () => {
        try {
          await api.get('/users/me', { timeout: 5000 });
          console.log('Login: Authentication verified successfully');
        } catch (err) {
          console.warn('Login: Auth verification failed, but proceeding anyway:', err.message);
        }
      }, 500);
      
    } catch (error) {
      console.error('Login: Error during login process:', error);
    }
  };

  // Enhanced logout function
  const logout = async () => {
    console.log('Logout: Starting...');
    
    // Clear any pending login verification timeout
    if (loginVerifyTimeoutRef.current) {
      clearTimeout(loginVerifyTimeoutRef.current);
      loginVerifyTimeoutRef.current = null;
    }
    
    try {
      // Call backend logout endpoint using the api instance
      await api.post('/auth/logout');
      console.log('Logout: Successfully called backend logout endpoint');
    } catch (err) {
      console.error('Logout: Backend logout failed:', err.message);
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
      
      // Clear Authorization header from api instance
      delete api.defaults.headers.common['Authorization'];
      
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