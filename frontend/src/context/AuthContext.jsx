import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from backend
  const refreshUser = async () => {
    try {
      const res = await axios.get('/users/me');
      setUser(res.data);
    } catch (err) {
      // If there's an error (e.g., token expired or not present), clear user
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
  const login = (userData) => {
    setUser(userData);
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if logout fails on backend, clear frontend state
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