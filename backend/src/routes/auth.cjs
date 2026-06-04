const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendEmail } = require('../utils/email.cjs');
const User = require('../models/User.cjs');
const logger = require('../utils/logger.cjs');

// Constant-time string comparison to prevent timing attacks
const safeCompare = (a, b) => {
  try {
    const sa = String(a || '');
    const sb = String(b || '');
    if (sa.length !== sb.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sa), Buffer.from(sb));
  } catch { return false; }
};

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

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
const OTP_STORE_MAX_SIZE = 10000;

// OTP expiration time in milliseconds (10 minutes)
const OTP_EXPIRATION_TIME = 10 * 60 * 1000;

// Cleanup expired OTPs every 5 minutes to prevent memory leak
const cleanupExpiredOtps = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const email in otpStore) {
    if (now - otpStore[email].timestamp > OTP_EXPIRATION_TIME) {
      delete otpStore[email];
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info(`Cleaned up ${cleanedCount} expired OTPs from memory`);
  }
};

// Run cleanup every 5 minutes - store reference so it can be cleared on shutdown
const otpCleanupInterval = setInterval(cleanupExpiredOtps, 5 * 60 * 1000);

// Unref the interval so it doesn't prevent Node.js from exiting gracefully
// This allows the process to exit even if the interval is still running
otpCleanupInterval.unref();



// @route   POST api/auth/send-otp
// @desc    Send OTP to user's email
// @access  Public
router.post('/send-otp', 
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    logger.auth('Received request to send signup OTP', req.body.email);
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.debug('Validation errors in send-otp:', errors.array());
        return res.status(400).json({ 
          msg: 'Please provide a valid email address', 
          errors: errors.array() 
        });
      }

      const { email } = req.body;
      logger.auth('Processing OTP request', email);
  
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user && user.status !== 'rejected') {
        logger.auth('User already exists', email);
        return res.status(400).json({ msg: 'An account with this email already exists and is pending approval.' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Evict oldest OTP if store is at capacity
      if (Object.keys(otpStore).length >= OTP_STORE_MAX_SIZE) {
        const oldest = Object.entries(otpStore).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) delete otpStore[oldest[0]];
      }
      otpStore[email] = {
        otp,
        timestamp: Date.now(),
      };
      // Only log OTP in development mode for debugging
      if (!isProduction) {
        logger.debug(`[DEV] OTP generated for ${email}:`, otp);
      } else {
        logger.auth('OTP generated', email);
      }

      logger.auth('Sending OTP to email', email);
      
      // Send the OTP email with improved error handling
      const emailResult = await sendEmail(
        email, 
        'BookSpace - Your Verification Code', 
        `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
      );
      
      if (!emailResult.success) {
        logger.error('Failed to send OTP email:', {
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
      
      logger.auth('OTP email sent successfully', email);
      res.status(200).json({ 
        msg: 'Verification code sent to your email address',
        messageId: emailResult.messageId 
      });
    } catch (err) {
      logger.error('Error in send-otp route:', err);
      res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
  });

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', otpLimiter, [
  body('name').isLength({ min: 2, max: 50 }).trim().escape().withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Please include a valid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits')
], async (req, res) => {
  logger.auth('Received signup request', req.body.email);
  
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.debug('Validation errors in signup:', errors.array());
    return res.status(400).json({ 
      msg: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { name, email, password, phone, role, otp } = req.body;

  try {
    // Verify OTP
    const storedOtp = otpStore[email];
    if (!storedOtp || !safeCompare(storedOtp.otp, otp)) {
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
    logger.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  body('password').isLength({ max: 128 }).withMessage('Password too long')
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
  logger.auth('Login attempt', email);

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user || user.isDeleted) {
      logger.auth('Login failed: User not registered or is deleted', email);
      return res.status(400).json({ msg: 'Invalid email or password' });
    }
    logger.debug('User found:', user.email);

    // Check if user is active
    if (user.status !== 'active') {
      logger.auth('Login failed: User not active', email);
      // Sanitize status to prevent XSS - only allow known valid statuses in response
      const validStatuses = ['pending', 'active', 'rejected', 'suspended'];
      const displayStatus = validStatuses.includes(user.status) ? user.status : 'unavailable';
      return res.status(400).json({ msg: `Your account is ${displayStatus}. Please contact an administrator.` });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.auth('Login failed: Password not matching', email);
      return res.status(400).json({ msg: 'Invalid email or password' });
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
      { expiresIn: '24h', algorithm: 'HS256' },
      (err, token) => {
        if (err) {
          logger.error('JWT sign error:', err.message);
          return res.status(500).json({ msg: 'Error generating authentication token' });
        }
        
        // Cookie settings - use 'lax' since frontend proxies API requests (same-origin)
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 86400000, // 24 hours
          path: '/',
        });
        
        logger.auth('Login successful, token set in cookie', email);
        
        res.status(200).json({ 
          msg: 'Logged in successfully', 
          user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
      }
    );
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/check-email
// @desc    Check if an email exists in the database (for forgot password)
// @access  Public
router.post('/check-email',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: 'Please provide a valid email address', exists: false });
    }
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      // Always return the same response to prevent user enumeration
      if (!user) {
        return res.status(200).json({ msg: 'If this email is registered, you can proceed with password reset' });
      }
      return res.status(200).json({ msg: 'If this email is registered, you can proceed with password reset' });
    } catch (err) {
      logger.error('Error checking email:', err.message);
      return res.status(200).json({ msg: 'If this email is registered, you can proceed with password reset' });
    }
  }
);

// @route   POST api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', 
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
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

  const { email } = req.body;
  logger.auth('Forgot password request received', email);

  try {
    // Always return the same response to prevent user enumeration attacks
    // Attackers cannot determine if an email exists in the system
    const successMessage = 'If an account exists with this email, an OTP has been sent.';
    
    let user = await User.findOne({ email });
    
    // If user doesn't exist, still return success message but don't send email
    if (!user) {
      logger.debug('Forgot password: User not found for email (not revealed to client):', email);
      // Return success message even though no email was sent (prevents enumeration)
      return res.status(200).json({ msg: successMessage });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Only log OTP in development mode
    if (!isProduction) {
      logger.debug(`[DEV] Generated OTP for password reset:`, otp);
    } else {
      logger.auth('Generated OTP for password reset', email);
    }
    
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();
    logger.debug('User saved with OTP');

    const emailResult = await sendEmail(
      email, 
      'Your OTP for Password Reset', 
      `Your OTP for password reset is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    );
    
    if (!emailResult.success) {
      logger.error('Failed to send OTP email for password reset:', {
        error: emailResult.error,
        code: emailResult.code,
        email: email
      });
      
      // Still return success message to prevent enumeration
      // Log the error internally but don't reveal to user
      return res.status(200).json({ msg: successMessage });
    }
    
    logger.auth('OTP email sent successfully', email);
    res.status(200).json({ msg: successMessage });
  } catch (err) {
    logger.error('Error in forgot-password route:', err.message);
    // Return generic success message even on error to prevent enumeration
    res.status(200).json({ msg: 'If an account exists with this email, an OTP has been sent.' });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', 
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits')
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

  const { email, otp } = req.body;
  logger.auth('Verify OTP request received', email);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      logger.debug('User not found for email:', email);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    if (!isProduction) {
      logger.debug('[DEV] Stored OTP:', user.resetPasswordOtp, 'Expires:', user.resetPasswordOtpExpires, 'Current Time:', Date.now());
    }

    if (!safeCompare(user.resetPasswordOtp, otp) || user.resetPasswordOtpExpires < Date.now()) {
      logger.auth('Invalid or expired OTP', email);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    logger.auth('OTP verified successfully', email);
    res.status(200).json({ msg: 'OTP verified successfully' });
  } catch (err) {
    logger.error('Error in verify-otp route:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset user password
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      msg: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { email, otp, newPassword } = req.body;
  logger.auth('Reset password request received', email);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      logger.debug('User not found for email:', email);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    if (!safeCompare(user.resetPasswordOtp, otp) || user.resetPasswordOtpExpires < Date.now()) {
      logger.auth('Invalid or expired OTP', email);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    await user.save();
    logger.auth('Password reset successfully', email);

    res.status(200).json({ msg: 'Password reset successfully' });
  } catch (err) {
    logger.error('Error in reset-password route:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user / Clear cookie and revoke token
// @access  Public
router.post('/logout', async (req, res) => {
  logger.auth('Logout request received');

  // Revoke the token so it cannot be reused even before it expires
  let token = null;
  if (req.header('Authorization')?.startsWith('Bearer ')) {
    token = req.header('Authorization').substring(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      const RevokedToken = require('../models/RevokedToken.cjs');
      await RevokedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
      });
    } catch (_) {
      // Token already invalid — nothing to revoke
    }
  }

  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  logger.auth('Logout successful, cookie cleared');
  res.status(200).json({ msg: 'Logged out successfully', success: true });
});

// Export cleanup function for graceful shutdown
router.cleanup = () => {
  clearInterval(otpCleanupInterval);
  logger.info('Auth module cleanup: OTP cleanup interval cleared');
};

module.exports = router;