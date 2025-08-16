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
  }, []);

  // Function to fetch user data from backend
  const refreshUser = async () => {
    console.log('refreshUser: Starting...');
    setLoading(true);

    try {
      console.log('refreshUser: Making /users/me request...');
      const res = await axios.get('/users/me');
      console.log('refreshUser: /users/me request successful. User data:', res.data);
      setUser(res.data);
    } catch (err) {
      console.error('refreshUser: /users/me request failed:', err.response ? err.response.data : err.message);
      // If there's an error (e.g., cookie not sent or invalid), clear user
      setUser(null);
    } finally {
      console.log('refreshUser: Finished. Loading set to false.');
      setLoading(false);
    }
  };

  // On initial load, try to fetch user data
  useEffect(() => {
    refreshUser();
  }, []);

  // Login function (token is now handled by httpOnly cookie from backend)
  const login = (userData) => { // Removed token parameter
    setUser(userData);
    // No need to set localStorage or Authorization header here
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/logout'); // Backend clears the httpOnly cookie
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);