const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User.cjs');

// In-memory storage for OTPs (for demonstration purposes)
const otpStore = {};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @route   POST api/auth/send-otp
// @desc    Send OTP to user's email
// @access  Public
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = {
      otp,
      timestamp: Date.now(),
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Signup',
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ msg: 'OTP sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
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
      role: role || 'user',
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Clean up OTP store
    delete otpStore[email];

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none',
          maxAge: 3600000, // 1 hour
        });
        res.status(200).json({ msg: 'Signed up successfully' });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not registered for email:', email);
      return res.status(400).json({ msg: 'User not registered' });
    }
    console.log('User found:', user.email);

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
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none',
          maxAge: 3600000, // 1 hour
        });
        res.status(200).json({ msg: 'Logged in successfully', user: { name: user.name, role: user.role } });
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

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', email);
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

module.exports = router;