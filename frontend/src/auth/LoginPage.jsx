import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ForgotPasswordModal } from '../components/shared';

import api from '../utils/api';
import logger from '../utils/logger';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate inputs on frontend first
    if (!email || !password) {
      setError('Please provide both email and password');
      setIsLoading(false);
      return;
    }
    
    try {
      logger.auth('Attempting login for:', email);
      
      // Create the request data object
      const loginData = { 
        email: email.trim(), 
        password: password 
      };
      
      logger.debug('Login request payload:', JSON.stringify(loginData));
      
      // Use our API utility with better error handling
      const res = await api.post('/auth/login', loginData);
      
      logger.debug('Login response:', res.data);
      
      // Extract user data from the response (token is in httpOnly cookie)
      const responseData = res.data;
      const user = responseData.user;
      
      if (!user) {
        logger.error('Invalid response format - missing user:', responseData);
        throw new Error('Invalid response from server - missing user data');
      }
      
      logger.auth('Login successful. User:', user.name, 'Role:', user.role);
      login(user);

      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      logger.error('Login error:', err);
      
      // Enhanced error handling
      if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.msg || 
                       (err.response.status === 400 ? 'Invalid email or password' : 'Server error');
                       
        logger.error('Server error response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: JSON.stringify(err.response.data),
        });
        
        setError(errorMsg);
      } else if (err.request) {
        // Request was made but no response
        setError('No response from server. Please check your internet connection.');
        logger.debug('No response received from server');
      } else {
        // Error in request setup
        setError(err.message || 'Failed to send login request');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-200 flex items-center justify-center p-4 transition-colors">
      <div 
        className="w-full max-w-4xl bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-[#1a1a1a] flex overflow-hidden"
      >
        {/* Left Side: Clean Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-600 text-white p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-blue-500/10"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div 
            className="relative z-10 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg">
              <img 
                src="/cropped-NEW-PCCE-LOGO.png" 
                alt="PCCE Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">PCCE BookSpace</h1>
            <p className="text-blue-100 text-base leading-relaxed">
              Padre Conceição College of Engineering<br />
              Venue Booking System
            </p>
          </div>
        </div>

        {/* Right Side: Enhanced Form */}
        <div 
          className="w-full md:w-1/2 p-8 sm:p-12"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Welcome Back!</h2>
            <p className="text-slate-600 dark:text-slate-400">Sign in to continue to your dashboard.</p>
          </div>
          
          {error && (
            <div 
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl relative mb-6 backdrop-blur-sm"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={onSubmit}>
            <div 
              className="relative"
            >
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={20} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
            </div>
            
            <div 
              className="relative"
            >
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={onChange}
                required
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-right">
              <button 
                type="button" 
                onClick={() => setIsForgotPasswordModalOpen(true)} 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-4 py-4 text-white bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in</span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p 
            className="text-sm text-center text-slate-600 dark:text-slate-400 mt-8"
          >
            Don't have an account? {' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;