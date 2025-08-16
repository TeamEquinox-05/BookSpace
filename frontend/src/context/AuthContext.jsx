import { createContext, useState, useEffect } from 'react';
import { useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from backend
  const refreshUser = async () => {
    setLoading(true); // Set loading to true at the very beginning
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    try {
      const res = await axios.get('/users/me');
      setUser(res.data);
    } catch (err) {
      // If there's an error (e.g., token expired or not present), clear user and token
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On initial load, try to fetch user data
  useEffect(() => {
    refreshUser();
  }, []);

  // Login function
  const login = (userData, token) => {
    setUser(userData);
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
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