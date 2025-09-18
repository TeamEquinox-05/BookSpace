import { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import axios from 'axios';

// Define base URL for API
const API_BASE_URL = 'https://bookspace-be.onrender.com/api';

// Create custom axios instance for the API
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000, // 15 second timeout for slow connections
  headers: {
    'Content-Type': 'application/json'
  }
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
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On initial load, try to fetch user data
  useEffect(() => {
    refreshUser();
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