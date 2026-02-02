import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Theme mode can be 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode');
    return savedTheme || 'system';
  });

  // Actual dark mode state based on theme mode and system preference
  const [darkMode, setDarkMode] = useState(false);

  // Track if initial load is complete using a ref to avoid dependency issues
  const isInitialLoadRef = useRef(true);

  // Function to get system preference
  const getSystemPreference = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Apply theme based on mode
  useEffect(() => {
    const applyTheme = () => {
      let shouldBeDark = false;

      if (themeMode === 'dark') {
        shouldBeDark = true;
      } else if (themeMode === 'light') {
        shouldBeDark = false;
      } else if (themeMode === 'system') {
        shouldBeDark = getSystemPreference();
      }

      setDarkMode(shouldBeDark);

      // Disable transitions during initial load
      if (isInitialLoadRef.current) {
        document.documentElement.classList.add('no-transition');
      }

      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Re-enable transitions after initial load
      if (isInitialLoadRef.current) {
        setTimeout(() => {
          document.documentElement.classList.remove('no-transition');
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    applyTheme();

    // Listen for system theme changes when in system mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [themeMode]);

  // Save theme mode to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Toggle between light and dark (used by header button)
  const toggleDarkMode = () => {
    if (themeMode === 'system') {
      // If in system mode, switch to opposite of current appearance
      const newMode = darkMode ? 'light' : 'dark';
      setThemeMode(newMode);
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  // Set specific theme mode (used by settings dropdown)
  const setTheme = (mode) => {
    if (['light', 'dark', 'system'].includes(mode)) {
      setThemeMode(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, themeMode, toggleDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
