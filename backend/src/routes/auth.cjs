const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendEmail } = require('../utils/email.cjs');
const User = require('../models/User.cjs');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { msg: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for OTP endpoints (more strict)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts per window
  message: { msg: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory storage for OTPs (for demonstration purposes)
const otpStore = {};



// @route   POST api/auth/send-otp
// @desc    Send OTP to user's email
// @access  Public
router.post('/send-otp', 
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    console.log('Received request to send signup OTP:', req.body);
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors in send-otp:', errors.array());
        return res.status(400).json({ 
          msg: 'Please provide a valid email address', 
          errors: errors.array() 
        });
      }

      const { email } = req.body;
      console.log('Processing OTP request for email:', email);
  
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        console.log('User already exists with email:', email);
        return res.status(400).json({ msg: 'An account with this email already exists and is pending approval.' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore[email] = {
        otp,
        timestamp: Date.now(),
      };
      console.log(`OTP generated for ${email}:`, otp);

      console.log('Sending OTP to email:', email);
      
      // Send the OTP email with improved error handling
      const emailResult = await sendEmail(
        email, 
        'BookSpace - Your Verification Code', 
        `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
      );
      
      if (!emailResult.success) {
        console.error('Failed to send OTP email:', {
          error: emailResult.error,
          code: emailResult.code,
          email: email
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to send verification email. Please try again later.';
        if (emailResult.code === 'ETIMEDOUT') {
          errorMessage = 'Email service is temporarily unavailable. Please try again in a few minutes.';
        } else if (emailResult.code === 'EAUTH') {
          errorMessage = 'Email authentication failed. Please contact support.';
        }
        
        return res.status(500).json({ 
          msg: errorMessage,
          technical: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
        });
      }
      
      console.log('OTP email sent successfully to:', email, 'MessageID:', emailResult.messageId);
      res.status(200).json({ 
        msg: 'Verification code sent to your email address',
        messageId: emailResult.messageId 
      });
    } catch (err) {
      console.error('Error in send-otp route:', err);
      res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
  });

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', [
  body('name').isLength({ min: 2, max: 50 }).trim().escape().withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Please include a valid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits')
], async (req, res) => {
  console.log('Received signup request:', req.body);
  
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors in signup:', errors.array());
    return res.status(400).json({ 
      msg: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { name, email, password, phone, role, otp } = req.body;

  try {
    // Verify OTP
    const storedOtp = otpStore[email];
    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    // Check if OTP has expired (e.g., 10 minutes)
    if (Date.now() - storedOtp.timestamp > 10 * 60 * 1000) {
      return res.status(400).json({ msg: 'OTP has expired' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role: 'user', // Force all new users to be 'user' role for security
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Clean up OTP store
    delete otpStore[email];

    res.status(200).json({ msg: 'Signup successful. Your account is pending approval.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      msg: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;
  console.log('Login attempt for email:', email);

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user || user.isDeleted) {
      console.log('Login failed: User not registered or is deleted for email:', email);
      return res.status(400).json({ msg: 'User not registered' });
    }
    console.log('User found:', user.email);

    // Check if user is active
    if (user.status !== 'active') {
      console.log('Login failed: User not active for email:', email);
      return res.status(400).json({ msg: `Your account is ${user.status}. Please contact an administrator.` });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password not matching for email:', email);
      return res.status(400).json({ msg: 'Password not matching' });
    }

    // Create payload
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }, // Extended token expiration to 24 hours for testing
      (err, token) => {
        if (err) throw err;
        
        // Enhanced cookie settings for cross-domain usage
        // Don't specify domain to let browser handle it correctly
        res.cookie('token', token, {
          httpOnly: true,
          secure: true, // Always use secure cookies
          sameSite: 'none', // Required for cross-domain cookies
          maxAge: 86400000, // 24 hours
          path: '/',
        });
        
        console.log('Login successful, token set in cookie');
        console.log('Origin header:', req.headers.origin);
        console.log('Referer header:', req.headers.referer);
        
        res.status(200).json({ 
          msg: 'Logged in successfully', 
          token, // Also sending token in response body for debugging
          user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('Forgot password request received for email:', email);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ msg: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp);
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();
    console.log('User saved with OTP');

    const emailResult = await sendEmail(
      email, 
      'Your OTP for Password Reset', 
      `Your OTP for password reset is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    );
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email for password reset:', {
        error: emailResult.error,
        code: emailResult.code,
        email: email
      });
      
      return res.status(500).json({ 
        msg: 'Failed to send OTP email. Please try again later.',
        error: emailResult.error 
      });
    }
    
    console.log('OTP email sent successfully to:', email);
    res.status(200).json({ msg: 'OTP sent to your email' });
  } catch (err) {
    console.error('Error in forgot-password route:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  console.log('Verify OTP request received for email:', email, 'with OTP:', otp);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ msg: 'User not found' });
    }

    console.log('Stored OTP:', user.resetPasswordOtp, 'Stored OTP Expires:', user.resetPasswordOtpExpires, 'Current Time:', Date.now());
    if (user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < Date.now()) {
      console.log('Invalid or expired OTP for email:', email);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    console.log('OTP verified successfully for email:', email);
    res.status(200).json({ msg: 'OTP verified successfully' });
  } catch (err) {
    console.error('Error in verify-otp route:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset user password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log('Reset password request received for email:', email);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ msg: 'User not found' });
    }

    if (user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < Date.now()) {
      console.log('Invalid or expired OTP for email:', email);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    await user.save();
    console.log('Password reset successfully for email:', email);

    res.status(200).json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error('Error in reset-password route:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/logout
// @desc    Logout user / Clear cookie
// @access  Public
router.post('/logout', (req, res) => {
  console.log('Logout request received');
  console.log('Origin header:', req.headers.origin);
  console.log('Referer header:', req.headers.referer);
  
  // Try multiple approaches to ensure cookie is properly cleared
  
  // Clear the cookie without specifying domain
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    expires: new Date(0), // Set expiration to a past date to clear the cookie
  });
  
  // For Render hosting specifically, also try clearing with the domain
  if (req.headers.origin && req.headers.origin.includes('vercel.app')) {
    res.cookie('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: new Date(0),
      domain: '.vercel.app'
    });
  }
  
  console.log('Logout successful, cookie cleared');
  res.status(200).json({ msg: 'Logged out successfully', success: true });
});

module.exports = router;