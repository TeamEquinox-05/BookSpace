import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { getApiUrl } from './config/api-config.js';

// Configure axios defaults
const initializeAxios = async () => {
  const apiUrl = await getApiUrl();
  axios.defaults.baseURL = apiUrl;
  axios.defaults.withCredentials = true;
  axios.defaults.timeout = 60000; // 60 second timeout to match AuthContext config
};

// Initialize axios configuration and then render the app
const startApp = async () => {
  // Wait for axios to be configured before rendering
  await initializeAxios();
  
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>,
  );
};

startApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
