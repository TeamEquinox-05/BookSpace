import { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import axios from 'axios';

// Add custom axios instance with error handling
const api = axios.create({
  baseURL: 'https://bookspace-be.onrender.com/api',
  withCredentials: true,
  timeout: 10000, // 10 second timeout
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
    // Configure the regular axios instance
    axios.defaults.withCredentials = true;
    
    // Configure our custom API instance with auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Add request interceptor to handle CORS preflight
    api.interceptors.request.use(
      config => {
        // Add CORS headers to every request
        config.headers['Access-Control-Allow-Origin'] = 'https://book-space-3xmh.vercel.app';
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor to handle errors
    api.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.message);
        if (error.message.includes('Network Error') || error.message.includes('CORS')) {
          console.log('CORS issue detected. Using localStorage token as fallback');
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Function to fetch user data from backend with improved error handling
  const refreshUser = async () => {
    console.log('refreshUser: Starting...');
    setLoading(true);

    try {
      // Check if we have a token in localStorage (fallback mechanism)
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('Using token from localStorage');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('refreshUser: Making /users/me request...');
      
      try {
        // First try using the custom api instance
        const res = await api.get('/users/me');
        console.log('refreshUser: /users/me request successful. User data:', res.data);
        setUser(res.data);
      } catch (apiError) {
        console.error('API request failed, trying direct axios:', apiError.message);
        
        // If that fails, try a direct approach
        const directRes = await axios.get('https://bookspace-be.onrender.com/api/users/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          withCredentials: true
        });
        
        console.log('refreshUser: Direct request successful. User data:', directRes.data);
        setUser(directRes.data);
      }
    } catch (err) {
      console.error('refreshUser: All attempts failed:', err.message);
      // If there's an error (e.g., cookie not sent or invalid), clear user
      setUser(null);
      // Also clear token from localStorage on auth failure
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      console.log('refreshUser: Finished. Loading set to false.');
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
    setUser(userData);
    
    // If we receive a token, store it as a fallback mechanism
    // This is critical since we're having CORS issues with cookies
    if (token) {
      console.log('Login: Storing auth token in localStorage');
      localStorage.setItem('authToken', token);
      
      // Set the token for both axios instances
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
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