import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Briefcase, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import { Spinner } from '../components/ui';

const SignupPage = ({ onSignupSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  const { name, email, password, phone, role, otp } = formData;
  
  // Countdown timer effect for OTP resending
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user is typing
    if (error) setError('');
  };

  // Function to extract error message from response
  const extractErrorMessage = (err) => {
    if (err.response?.data?.msg) {
      return err.response.data.msg;
    } else if (err.response?.data?.message) {
      return err.response.data.message;
    } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return 'The server is taking too long to respond. This could be due to high traffic or connection issues. Please try again later.';
    } else if (err.message.includes('Network Error')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    return 'Server error. Please try again later or contact support if the problem persists.';
  };

  const handleSendOtp = async () => {
    // Validate all required fields before sending OTP
    if (!name || name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    
    if (name.trim().length > 50) {
      setError('Name must be less than 50 characters');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Validate phone if provided
    if (phone && phone.trim()) {
      const phoneRegex = /^[0-9]{10,}$/;
      if (!phoneRegex.test(phone.trim().replace(/[\s\-\(\)]/g, ''))) {
        setError('Please enter a valid phone number (at least 10 digits)');
        return;
      }
    }

    setSendingOtp(true);
    setError('');
    
    const trimmedEmail = email.trim();
    console.log(`Sending OTP to email: ${trimmedEmail}`);
    
    try {
      // Use the smart API utility that automatically detects local vs remote backend
      const otpResponse = await api.post('/auth/send-otp', { email: trimmedEmail });
      console.log('OTP sent successfully via smart API detection');
      
      console.log(`OTP sent successfully, response:`, otpResponse.data);
      setOtpSent(true);
      
      // Set timer for resend
      setOtpTimer(60);
      setIsResendDisabled(true);
      
      // Start countdown timer
      const interval = setInterval(() => {
        setOtpTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setIsResendDisabled(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error(`Error sending OTP:`, err);
      
      // More detailed error logging
      const debugInfo = {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      };
      console.log('Detailed error info:', debugInfo);
      
      // Provide specific guidance based on the error type
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('The server is taking longer than expected to send the OTP. This might be due to email delivery delays. Please wait a moment and try again, or check your spam folder.');
      } else if (err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (err.response?.status === 500) {
        setError('There was an issue with the email service. Please try again in a few moments or contact support if the problem persists.');
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    // Validate inputs before submission
    if (!name || !email || !password || !otp) {
      setError('All required fields must be filled');
      return;
    }
    
    if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use the smart API utility that automatically detects local vs remote backend
      const signupResponse = await api.post('/auth/signup', formData);
      console.log('Signup successful via smart API detection');
      
      console.log('Signup successful, response:', signupResponse.data);
      setSignupSuccess(true);
    } catch (err) {
      console.error('Error during signup:', err);
      
      // More detailed error logging
      const debugInfo = {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      };
      console.log('Detailed error info:', debugInfo);
      
      // Log specific validation errors if present
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        console.log('Validation errors:', err.response.data.errors);
        // Show the first validation error to the user
        const firstError = err.response.data.errors[0];
        setError(firstError.msg || extractErrorMessage(err));
        return;
      }
      
      // Special handling for timeout errors
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Server is taking too long to respond. Please try again later or contact support.');
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex overflow-hidden">
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-600 text-white p-12">
          [Image of diverse team collaborating]
          <h1 className="text-4xl font-bold mb-3">Join BookSpace</h1>
          <p className="text-center text-blue-100">Start organizing your events and bookings seamlessly.</p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          {signupSuccess ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-600">Signup Successful!</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Your account has been created and is pending approval from an administrator.</p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">You will be notified by email once your account is approved.</p>
              <Link to="/login" className="mt-6 inline-block px-6 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Create Account</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">Get started with a free account today.</p>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={onSubmit}>
                {!otpSent ? (
                  <>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input type="text" name="name" value={name} onChange={onChange} required placeholder="Full Name" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input type="email" name="email" value={email} onChange={onChange} required placeholder="Email Address" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={onChange} required placeholder="Password" className="w-full pl-10 pr-10 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                      <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input type="text" name="phone" value={phone} onChange={onChange} placeholder="Phone Number (Optional)" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <select name="role" value={role} onChange={onChange} className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
                        <option value="user">User</option>
                        {/* Admin role removed from public signup */}
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-4">
                      A verification code has been sent to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
                    </p>
                    

                    
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Enter 6-digit verification code
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="otp" 
                          value={otp} 
                          onChange={(e) => {
                            // Only allow digits and limit to 6 characters
                            const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                            onChange({
                              target: {
                                name: 'otp',
                                value
                              }
                            });
                          }} 
                          required 
                          placeholder="Enter 6-digit code" 
                          className="w-full text-center tracking-[0.3em] font-semibold text-lg py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Didn't receive the code? Check your spam folder or request a new code below.
                      </p>
                    </div>
                  </div>
                )}
                
                {!otpSent ? (
                  <button 
                    type="button" 
                    onClick={handleSendOtp} 
                    disabled={sendingOtp} 
                    className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {sendingOtp ? (
                      <span className="flex items-center justify-center">
                        <Spinner centered={false} size="sm" color="white" />
                        <span className="ml-2">Sending OTP...</span>
                      </span>
                    ) : 'Send OTP & Continue'}
                  </button>
                ) : (
                  <>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full px-4 py-3 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <Spinner centered={false} size="sm" color="white" />
                          <span className="ml-2">Creating Account...</span>
                        </span>
                      ) : 'Create Account'}
                    </button>
                    
                    <div className="text-center mt-4">
                      <button 
                        type="button"
                        onClick={handleSendOtp} 
                        disabled={isResendDisabled || sendingOtp} 
                        className="text-sm font-medium text-blue-600 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        {sendingOtp ? 'Sending...' : (otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP')}
                      </button>
                    </div>
                  </>
                )}
              </form>

              <p className="text-sm text-center text-slate-600 dark:text-slate-400 mt-8">
                Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;