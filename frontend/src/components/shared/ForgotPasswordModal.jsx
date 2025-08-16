import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Lock, X, Loader2 } from 'lucide-react';

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
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-500'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <p className={`mt-2 text-xs font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                {step}
              </p>
            </div>
            {stepNumber < steps.length && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
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
        // etc.
    }, 300); // Allow modal to animate out
  }

  const handleSendOtp = async (isResend = false) => {
    if (timer > 0 && !isResend) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      if (!isResend) setStep(2);
      setMessage({ text: res.data.msg, type: 'success' });
      setTimer(60);
      setIsResendDisabled(true);
    } catch (err) {
      setMessage({ text: err.response?.data?.msg || 'Server error. Please try again later.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('Sending OTP verification request with:', { email, otp });
      const res = await axios.post('/auth/verify-otp', { email, otp: otp.trim() });
      setStep(3);
      setMessage({ text: res.data.msg, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.msg || 'Server error.', type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/auth/reset-password', { email, otp, newPassword });
      setMessage({ text: res.data.msg, type: 'success' });
      setTimeout(resetStateAndClose, 2000);
    } catch (err) {
      setMessage({ text: err.response?.data?.msg || 'Server error.', type: 'error' });
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
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">Enter your email address and we'll send you an OTP to reset your password.</p>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <button onClick={() => handleSendOtp()} disabled={loading} className="w-full flex justify-center items-center mt-4 px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
            </button>
          </>
        );
      case 2:
        return (
            <>
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">An OTP has been sent to <strong className='text-slate-700 dark:text-slate-300'>{email}</strong>. Please enter it below.</p>
              <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className="w-full pl-10 text-center tracking-[0.3em] font-semibold text-lg py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <button onClick={handleVerifyOtp} disabled={loading} className="w-full flex justify-center items-center mt-4 px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : 'Verify OTP'}
              </button>
              <div className="text-center mt-4">
                  <button onClick={() => handleSendOtp(true)} disabled={isResendDisabled || timer > 0 || loading} className="text-sm font-medium text-blue-600 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed">
                      {loading && isResendDisabled ? 'Sending...' : (timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP')}
                  </button>
              </div>
            </>
          );
      case 3:
        return (
            <>
                <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">Create a new, strong password for your account.</p>
                <div className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                </div>
                <button onClick={handleResetPassword} disabled={loading} className="w-full flex justify-center items-center mt-4 px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
              </button>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={resetStateAndClose}>
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-xl shadow-2xl dark:bg-slate-800 transform transition-all" onClick={e => e.stopPropagation()}>
        <button onClick={resetStateAndClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
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