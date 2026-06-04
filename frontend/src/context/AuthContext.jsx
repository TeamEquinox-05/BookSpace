import { createContext, useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';

// Cache expiry time: 5 minutes
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to track if a refresh is already in progress to prevent duplicate calls
  const isRefreshingRef = useRef(false);

  // Check if cached user data is still valid (not expired)
  const getCachedUser = () => {
    const storedUser = localStorage.getItem('userData');
    const storedTimestamp = localStorage.getItem('userDataTimestamp');
    if (storedUser && storedTimestamp) {
      const age = Date.now() - parseInt(storedTimestamp, 10);
      if (age < CACHE_EXPIRY_MS) {
        try {
          return JSON.parse(storedUser);
        } catch {
          localStorage.removeItem('userData');
          localStorage.removeItem('userDataTimestamp');
        }
      } else {
        // Cache expired, clear it
        localStorage.removeItem('userData');
        localStorage.removeItem('userDataTimestamp');
      }
    }
    return null;
  };

  const refreshUser = async () => {
    // Prevent duplicate refresh calls
    if (isRefreshingRef.current) {
      logger.auth('Refresh already in progress, skipping duplicate call');
      return false;
    }
    
    logger.auth('Starting user data refresh...');
    isRefreshingRef.current = true;
    
    // Check for cached user data for offline fallback
    const cachedUser = getCachedUser();
    
    try {
      // Set a short timeout to avoid blocking the UI
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Backend connection timed out')), 10000);
      });
      
      // Race between the fetch request and the timeout
      // Cookie is sent automatically via withCredentials
      logger.auth('Fetching user data with cookie auth...');
      const res = await Promise.race([
        api.get('/users/me'),
        timeoutPromise
      ]);
      
      logger.auth('User data received successfully');
      setUser(res.data);
      
      // Cache the user data with timestamp for offline access
      localStorage.setItem('userData', JSON.stringify(res.data));
      localStorage.setItem('userDataTimestamp', Date.now().toString());
      
      return true;
    } catch (error) {
      logger.error('Error refreshing user:', error);
      
      if (error.code === 'ECONNABORTED' || error.message === 'Backend connection timed out') {
        logger.warn('Connection timeout. Server may be down or network issues.');
        if (cachedUser) {
          logger.auth('Using cached user data due to timeout');
          setUser(cachedUser);
          return true;
        }
      } else if (error.response) {
        logger.auth('Server responded with status:', error.response.status);
        if (error.response.status === 401 || error.response.status === 403) {
          logger.auth('Authentication error detected, clearing cached data');
          localStorage.removeItem('userData');
          localStorage.removeItem('userDataTimestamp');
          setUser(null);
          return false;
        }
      } else if (error.request) {
        logger.warn('No response received from server');
        if (cachedUser) {
          logger.auth('Using cached user data due to network error');
          setUser(cachedUser);
          return true;
        }
      }
      
      // Fallback to cached data for other errors
      if (cachedUser) {
        logger.auth('Using cached user data as fallback');
        setUser(cachedUser);
        return true;
      }
      
      setUser(null);
      return false;
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  };

  // On initial load, try to fetch user data or use cached data
  useEffect(() => {
    // Try to load cached user data immediately to prevent UI blocking
    const cachedUser = getCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      logger.auth('Temporarily using cached user data while refreshing');
    }
    
    // Then attempt to refresh from server
    const attemptRefresh = async () => {
      const success = await refreshUser();
      if (!success) {
        logger.info('Using offline mode. Some features may be limited.');
      }
    };
    
    attemptRefresh();
  }, []);

  // Login function - cookie-based auth, no token in localStorage
  const login = (userData) => {
    logger.auth('Login: Setting user data');
    
    if (!userData) {
      logger.error('Login failed: Missing user data');
      return;
    }
    
    try {
      // Store the user in state
      setUser(userData);
      
      // Cache the user data for offline access
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userDataTimestamp', Date.now().toString());
      
      logger.auth('Login: User data cached');
    } catch (error) {
      logger.error('Login: Error during login process:', error);
    }
  };

  // Enhanced logout function
  const logout = async () => {
    logger.auth('Logout: Starting...');
    
    try {
      // Call backend logout endpoint to clear the httpOnly cookie
      await api.post('/auth/logout');
      logger.auth('Logout: Successfully called backend logout endpoint');
    } catch (err) {
      logger.error('Logout: Backend logout failed:', err.message);
    } finally {
      // Clean up all cached data
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('userDataTimestamp');
      
      logger.auth('Logout: Completed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);