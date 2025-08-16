import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Briefcase } from 'lucide-react';

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

  const { name, email, password, phone, role, otp } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/auth/send-otp', { email });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Server error. Please try again later.');
    }
    setLoading(false);
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/auth/signup', formData);
      localStorage.setItem('token', res.data.token);
      const decodedToken = JSON.parse(atob(res.data.token.split('.')[1]));
      if (decodedToken.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      // onSignupSuccess(); // This function is not passed as a prop
    } catch (err) {
      setError(err.response?.data?.msg || 'Server error. Please try again later.');
    }
    setLoading(false);
  };

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
                  <input type="password" name="password" value={password} onChange={onChange} required placeholder="Password" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" name="phone" value={phone} onChange={onChange} placeholder="Phone Number (Optional)" className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <select name="role" value={role} onChange={onChange} className="w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <p className="text-center text-slate-600 dark:text-slate-400 mb-4">An OTP has been sent to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>. Please enter it below.</p>
                <div className="relative">
                  <input type="text" name="otp" value={otp} onChange={onChange} required placeholder="Enter 6-digit OTP" className="w-full text-center tracking-[0.5em] font-semibold text-lg pr-3 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
            )}
            
            {!otpSent ? (
              <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                {loading ? 'Sending OTP...' : 'Send OTP & Continue'}
              </button>
            ) : (
              <button type="submit" disabled={loading} className="w-full px-4 py-3 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                {loading ? 'Verifying...' : 'Create Account'}
              </button>
            )}
          </form>

          <p className="text-sm text-center text-slate-600 dark:text-slate-400 mt-8">
            Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;