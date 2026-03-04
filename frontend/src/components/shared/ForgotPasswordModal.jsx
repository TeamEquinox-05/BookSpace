import React, { useState, useEffect, useRef } from 'react';
import { Mail, KeyRound, Lock, X } from 'lucide-react';
import { Spinner } from '../ui';
import api from '../../utils/api';
import axios from 'axios';
import logger from '../../utils/logger';

// Helper component for the step indicator
const StepIndicator = ({ currentStep }) => {
  const steps = ['Email', 'Verify OTP', 'Reset'];
  return (
    <div className="flex justify-between items-center mb-6">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isActive = currentStep === stepNumber;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-[#1a1a1a] border-slate-300 dark:border-[#2a2a2a] text-slate-500'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <p className={`mt-2 text-xs font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                {step}
              </p>
            </div>
            {stepNumber < steps.length && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-[#2a2a2a]'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};


const ForgotPasswordModal = ({ isOpen, onClose }) => {
  // --- All state and logic remains unchanged ---
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs for cleanup of AbortControllers and timeouts
  const abortControllerRef = useRef(null);
  const timeoutIdRef = useRef(null);

  // Cleanup AbortController and timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const resetStateAndClose = () => {
    onClose();
    setTimeout(() => {
        setStep(1);
        setMessage('');
        setEmail('');
        setOtp('');
        // Clear password state for security - don't keep passwords in memory
        setNewPassword('');
        setConfirmPassword('');
    }, 300); // Allow modal to animate out
  }

  // Utility function to extract error messages from different API response formats
  const extractErrorMessage = (error) => {
    if (error.response?.data?.msg) {
      return error.response.data.msg;
    } else if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.data?.error) {
      return error.response.data.error;
    } else if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    } else if (error.message.includes('Network Error')) {
      return 'Network error. Please check your connection.';
    }
    return 'Server error. Please try again later.';
  };

  const handleSendOtp = async (isResend = false) => {
    // Validate email first with better validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }
    
    // Prevent rapid re-sends
    if (timer > 0 && !isResend) return;
    
    setLoading(true);
    setMessage('');
    
    const trimmedEmail = email.trim();
    logger.auth(`Sending OTP to email:`, trimmedEmail, isResend ? '(resend)' : '(first attempt)');
    
    // Clean up any existing abort controller/timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create an abort controller to handle timeouts manually
    abortControllerRef.current = new AbortController();
    timeoutIdRef.current = setTimeout(() => abortControllerRef.current?.abort(), 25000); // 25 second timeout
    
    try {
      // Try with our API utility first
      let response;
      try {
        response = await api.post('/auth/forgot-password', { email: trimmedEmail });
      } catch (apiError) {
        logger.warn('API utility request failed, falling back to direct axios:', apiError);
        
        // Fall back to direct axios call if API utility fails
        response = await axios({
          method: 'post',
          url: 'https://bookspace-be.onrender.com/api/auth/forgot-password',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // Removed custom header causing CORS issues
          },
          data: { email: trimmedEmail },
          timeout: 30000, // 30 second timeout
          withCredentials: true, // Include credentials for cross-origin requests
          signal: abortControllerRef.current.signal
        });
      }
      
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.auth('OTP sent successfully, response:', response.data);
      
      // Only advance to next step on first attempt, not on resend
      if (!isResend) setStep(2);
      
      // Display success message and set cooldown timer
      setMessage({ text: response.data.msg || 'OTP sent successfully', type: 'success' });
      setTimer(60);
      setIsResendDisabled(true);
    } catch (err) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.error('Error sending OTP:', err);
      
      // More detailed error breakdown
      let debugInfo = {
        url: '/auth/forgot-password',
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.config?.headers,
        message: err.message
      };
      logger.debug('Detailed error info:', debugInfo);
      
      // Extract the most accurate error message
      const errorMessage = extractErrorMessage(err);
      
      setMessage({ text: errorMessage, type: 'error' });
      setIsResendDisabled(false); // Allow immediate retry on error
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    // Validate OTP with improved validation
    if (!otp || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setMessage({ text: 'Please enter a valid 6-digit OTP', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const trimmedEmail = email.trim();
    const trimmedOTP = otp.trim();
    
    logger.auth('Verifying OTP for email:', trimmedEmail);
    
    // Clean up any existing abort controller/timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create an abort controller for manual timeout handling
    abortControllerRef.current = new AbortController();
    timeoutIdRef.current = setTimeout(() => abortControllerRef.current?.abort(), 25000); // 25 second timeout
    
    try {
      // Try with API utility first
      let response;
      try {
        response = await api.post('/auth/verify-otp', { 
          email: trimmedEmail, 
          otp: trimmedOTP 
        });
      } catch (apiError) {
        logger.warn('API utility request failed for verify OTP, falling back to direct axios:', apiError);
        
        // Fall back to direct axios
        response = await axios({
          method: 'post',
          url: 'https://bookspace-be.onrender.com/api/auth/verify-otp',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // Removed custom header causing CORS issues
          },
          data: { 
            email: trimmedEmail, 
            otp: trimmedOTP 
          },
          timeout: 30000, // 30 second timeout
          withCredentials: true, // Include credentials for cross-origin requests
          signal: abortControllerRef.current.signal
        });
      }
      
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.auth('OTP verification successful:', response.data);
      
      // Move to reset password step
      setStep(3);
      setMessage({ text: response.data.msg || 'OTP verified successfully', type: 'success' });
    } catch (err) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.error('Error verifying OTP:', err);
      
      // More detailed error breakdown
      const debugInfo = {
        url: '/auth/verify-otp',
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.config?.headers,
        message: err.message
      };
      logger.debug('Detailed OTP verification error:', debugInfo);
      
      // Extract the most accurate error message
      const errorMessage = extractErrorMessage(err);
      
      // Special handling for common OTP errors
      if (err.response?.status === 400) {
        if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
          setMessage({ 
            text: errorMessage + '. Please request a new OTP.', 
            type: 'error' 
          });
          return;
        }
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Enhanced password validation
    if (!newPassword || !confirmPassword) {
      setMessage({ text: 'Both password fields are required', type: 'error' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    
    // Check for secure password (optional enhanced validation)
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setMessage({ text: 'Password must contain both letters and numbers', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const trimmedEmail = email.trim();
    const trimmedOTP = otp.trim();
    
    logger.auth('Sending password reset request for:', trimmedEmail);
    
    // Clean up any existing abort controller/timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create an abort controller for manual timeout handling
    abortControllerRef.current = new AbortController();
    timeoutIdRef.current = setTimeout(() => abortControllerRef.current?.abort(), 25000); // 25 second timeout
    
    try {
      // Try with API utility first
      let response;
      try {
        response = await api.post('/auth/reset-password', { 
          email: trimmedEmail, 
          otp: trimmedOTP, 
          newPassword 
        });
      } catch (apiError) {
        logger.warn('API utility request failed for password reset, falling back to direct axios:', apiError);
        
        // Fall back to direct axios
        response = await axios({
          method: 'post',
          url: 'https://bookspace-be.onrender.com/api/auth/reset-password',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            // Removed custom header causing CORS issues
          },
          data: { 
            email: trimmedEmail, 
            otp: trimmedOTP, 
            newPassword 
          },
          timeout: 30000, // 30 second timeout
          withCredentials: true, // Include credentials for cross-origin requests
          signal: abortControllerRef.current.signal
        });
      }
      
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.auth('Password reset successful:', response.data);
      
      // Show success message with animation
      setMessage({ 
        text: response.data.msg || 'Password reset successfully! You can now log in with your new password.', 
        type: 'success' 
      });
      
      // Show success message for a moment before closing
      setTimeout(() => {
        resetStateAndClose();
      }, 2000);
    } catch (err) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.error('Error resetting password:', err);
      
      // More detailed error breakdown
      const debugInfo = {
        url: '/auth/reset-password',
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.config?.headers,
        message: err.message
      };
      logger.debug('Detailed password reset error:', debugInfo);
      
      // Extract the most accurate error message
      const errorMessage = extractErrorMessage(err);
      
      // Special handling for expired OTP
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('expired')) {
        setMessage({ 
          text: 'Your verification code has expired. Please restart the password reset process.', 
          type: 'error' 
        });
        
        // Option to return to first step
        setTimeout(() => {
          setStep(1);
        }, 3000);
        return;
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  // --- End of unchanged logic ---

  if (!isOpen) return null;

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
            
            <div className="mb-2">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error message when user starts typing
                    if (message && message.type === 'error') {
                      setMessage(null);
                    }
                  }} 
                  onKeyDown={(e) => {
                    // Submit on Enter key
                    if (e.key === 'Enter' && !loading && email) {
                      handleSendOtp();
                    }
                  }}
                  placeholder="Enter your registered email" 
                  className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You'll receive a 6-digit verification code at this email.
              </p>
            </div>
            
            <button 
              onClick={() => handleSendOtp()} 
              disabled={loading || !email || email.trim().length < 5 || !email.includes('@')} 
              className="w-full flex justify-center items-center mt-4 px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all"
            >
              {loading ? 
                <Spinner centered={false} size="sm" text="Sending verification code" color="white" /> : 
                'Send Verification Code'
              }
            </button>
            
            {message && message.type === 'error' && (
              <div className="text-center mt-4">
                <button 
                  onClick={() => setMessage(null)} 
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
          </>
        );
      case 2:
        return (
            <>
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
                An OTP has been sent to <strong className='text-slate-700 dark:text-slate-300'>{email}</strong>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Enter 6-digit verification code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    pattern="\d{6}" 
                    maxLength={6}
                    value={otp} 
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setOtp(value);
                    }}
                    placeholder="Enter 6-digit code" 
                    className="w-full pl-10 text-center tracking-[0.3em] font-semibold text-lg py-3 bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Didn't receive the code? Check your spam folder or request a new code below.
                </p>
              </div>
              
              <button 
                onClick={handleVerifyOtp} 
                disabled={loading || otp.length !== 6} 
                className="w-full flex justify-center items-center mt-4 px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all"
              >
                {loading ? <Spinner centered={false} size="sm" text="Verifying" color="white" /> : 'Verify Code'}
              </button>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-[#1a1a1a]">
                <button 
                  onClick={() => setStep(1)} 
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Change Email
                </button>
                
                <button 
                  onClick={() => handleSendOtp(true)} 
                  disabled={isResendDisabled || timer > 0 || loading} 
                  className="text-sm font-medium text-blue-600 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {loading && isResendDisabled ? 
                    'Sending...' : 
                    (timer > 0 ? 
                      `Resend code in ${timer}s` : 
                      'Resend code'
                    )
                  }
                </button>
              </div>
            </>
          );
      case 3:
        return (
            <>
                <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Create a new, strong password for your account.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    // Clear error when typing
                                    if (message && message.type === 'error') {
                                        setMessage(null);
                                    }
                                }} 
                                placeholder="Enter new password" 
                                className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                autoComplete="new-password"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Password must be at least 6 characters and include both letters and numbers.
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    // Clear error when typing
                                    if (message && message.type === 'error') {
                                        setMessage(null);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    // Submit on Enter key if both fields are filled
                                    if (e.key === 'Enter' && !loading && newPassword && confirmPassword) {
                                        handleResetPassword();
                                    }
                                }}
                                placeholder="Confirm your new password" 
                                className={`w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-[#1a1a1a] border rounded-lg focus:outline-none focus:ring-2 transition ${
                                    confirmPassword && newPassword !== confirmPassword 
                                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                                        : 'border-slate-200 dark:border-[#2a2a2a] focus:ring-blue-500'
                                }`}
                                autoComplete="new-password"
                                disabled={loading}
                            />
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">
                                Passwords don't match
                            </p>
                        )}
                    </div>
                </div>
                
                <button 
                    onClick={handleResetPassword} 
                    disabled={
                        loading || 
                        !newPassword || 
                        !confirmPassword || 
                        newPassword !== confirmPassword || 
                        newPassword.length < 6
                    } 
                    className="w-full flex justify-center items-center mt-6 px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all"
                >
                    {loading ? 
                        <Spinner centered={false} size="sm" text="Resetting password" color="white" /> : 
                        'Reset Password'
                    }
                </button>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={resetStateAndClose}>
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-xl shadow-2xl dark:bg-[#0a0a0a] transform transition-all" onClick={e => e.stopPropagation()}>
        <button onClick={resetStateAndClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]">
          <X size={20} />
        </button>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Password Recovery</h2>
        </div>
        <div className="my-6">
            <StepIndicator currentStep={step} />
        </div>
        
        {message && (
            <div className={`p-3 mb-4 rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-red-100/80 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-green-100/80 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                {message.text}
            </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;