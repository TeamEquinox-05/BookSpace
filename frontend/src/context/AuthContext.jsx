import { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios to send cookies with requests
  useEffect(() => {
    axios.defaults.withCredentials = true;
    
    // Check if we have a token in localStorage and set the Authorization header
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Function to fetch user data from backend
  const refreshUser = async () => {
    console.log('refreshUser: Starting...');
    setLoading(true);

    try {
      console.log('refreshUser: Making /users/me request...');
      
      // Check if we have a token in localStorage (fallback mechanism)
      const token = localStorage.getItem('authToken');
      if (token && !axios.defaults.headers.common['Authorization']) {
        console.log('Setting Authorization header from localStorage token');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await axios.get('/users/me');
      console.log('refreshUser: /users/me request successful. User data:', res.data);
      setUser(res.data);
    } catch (err) {
      console.error('refreshUser: /users/me request failed:', err.response ? err.response.data : err.message);
      // If there's an error (e.g., cookie not sent or invalid), clear user
      setUser(null);
      // Also clear token from localStorage on auth failure
      localStorage.removeItem('authToken');
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

  // Login function that can handle both cookie-based auth and token-based auth
  const login = (userData, token) => {
    setUser(userData);
    
    // If we receive a token, store it as a fallback mechanism
    // This is in case the httpOnly cookie doesn't work properly in the deployed environment
    if (token) {
      localStorage.setItem('authToken', token);
      // Also set the default Authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  // Enhanced logout function that ensures complete cleanup
  const logout = async () => {
    console.log('Logout: Starting...');
    try {
      // Clear backend session by calling logout endpoint
      await axios.post('/auth/logout');
      console.log('Logout: Successfully called backend logout endpoint');
    } catch (err) {
      console.error('Logout: Backend logout failed:', err.message);
      // Continue with frontend cleanup even if backend call fails
    } finally {
      // Clean up all authentication data
      console.log('Logout: Cleaning up frontend auth state');
      
      // Clear user state
      setUser(null);
      
      // Clear any stored tokens
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      // Clear Authorization header
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