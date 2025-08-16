import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ForgotPasswordModal from '../components/shared/ForgotPasswordModal';
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', formData);
      const { user } = res.data;
      localStorage.setItem('role', user.role);
      localStorage.setItem('userName', user.name);
      console.log('Login successful. User role:', user.role);
      if (user.role === 'admin') {
        console.log('Navigating to /admin');
        navigate('/admin');
      } else {
        console.log('Navigating to /dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Server error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex overflow-hidden">
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-600 text-white p-12">
          [Image of modern office workspace for branding]
          <h1 className="text-4xl font-bold mb-3">BookSpace</h1>
          <p className="text-center text-blue-100">Effortlessly manage and book your ideal venues.</p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Welcome Back!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Sign in to continue to your dashboard.</p>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                placeholder="Email Address"
                className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                placeholder="Password"
                className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="text-right">
              <button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Forgot Password?
              </button>
            </div>
            
            <button type="submit" className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Login
            </button>
          </form>

          <p className="text-sm text-center text-slate-600 dark:text-slate-400 mt-8">
            Don't have an account? <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Sign Up</Link>
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