import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2, Users, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ForgotPasswordModal } from '../components/shared';
import { Spinner } from '../components/ui';
import api from '../utils/api';

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
      console.log('Attempting login for:', email);
      
      // Create the request data object
      const loginData = { 
        email: email.trim(), 
        password: password 
      };
      
      console.log('Login request payload:', JSON.stringify(loginData));
      
      // Use our API utility with better error handling
      const res = await api.post('/auth/login', loginData);
      
      console.log('Login response:', res.data);
      
      // Extract user and token data from the response
      // Handle both formats: { user, token } and { msg, token, user }
      const responseData = res.data;
      const user = responseData.user;
      const token = responseData.token;
      
      if (!user) {
        console.error('Invalid response format - missing user:', responseData);
        throw new Error('Invalid response from server - missing user data');
      }
      
      if (!token) {
        console.error('Invalid response format - missing token:', responseData);
        throw new Error('Invalid response from server - missing authentication token');
      }
      
      console.log('Login successful. User:', user.name, 'Role:', user.role);
      login(user, token);
      
      // Verify the token has been stored
      setTimeout(() => {
        const storedToken = localStorage.getItem('token');
        console.log('Stored token check:', storedToken ? 'Present' : 'Missing');
      }, 100);
      
      // Short delay to ensure state updates before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (user.role === 'admin') {
        console.log('Navigating to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('Navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Enhanced error handling
      if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.msg || 
                       (err.response.status === 400 ? 'Invalid email or password' : 'Server error');
                       
        console.error('Server error response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: JSON.stringify(err.response.data),
        });
        
        setError(errorMsg);
      } else if (err.request) {
        // Request was made but no response
        setError('No response from server. Please check your internet connection.');
        console.log('No response received from server');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 flex overflow-hidden"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Side: Enhanced Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <motion.div 
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Building2 className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4">BookSpace</h1>
            <p className="text-blue-100 mb-8 text-lg leading-relaxed">
              Effortlessly manage and book your ideal venues with our modern platform.
            </p>
            
            {/* Feature highlights */}
            <div className="space-y-4 text-left">
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Calendar className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Smart booking management</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Users className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Team collaboration tools</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Building2 className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Real-time availability</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Enhanced Form */}
        <motion.div 
          className="w-full md:w-1/2 p-8 sm:p-12"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Welcome Back!</h2>
            <p className="text-slate-600 dark:text-slate-400">Sign in to continue to your dashboard.</p>
          </div>
          
          {error && (
            <motion.div 
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl relative mb-6 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </motion.div>
          )}
          
          <form className="space-y-6" onSubmit={onSubmit}>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={20} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={onChange}
                required
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </motion.div>

            <div className="text-right">
              <button 
                type="button" 
                onClick={() => setIsForgotPasswordModalOpen(true)} 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            
            <motion.button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-4 py-4 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              {isLoading ? (
                <Spinner centered={false} size="sm" text="Signing in" />
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <motion.p 
            className="text-sm text-center text-slate-600 dark:text-slate-400 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            Don't have an account? {' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign Up
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
      
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;