const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User.cjs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');
const logger = require('../utils/logger.cjs');

const { sendEmail } = require('../utils/email.cjs');

// Helper function to escape special regex characters (prevents ReDoS attacks)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid user ID format' });
  }
  next();
};

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/users/me
// @desc    Update current user profile (name, phone)
// @access  Private
router.put('/me', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/users/me/password
// @desc    Change current user password
// @access  Private
router.put('/me/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/users
// @desc    Get all users with pagination, search, and filtering
// @access  Private (Admin only)
router.get('/', auth, verifyRole('admin'), async (req, res) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10)); // Limit between 1-100
  const search = req.query.search || '';
  const status = req.query.status || '';

  const query = { isDeleted: false };
  if (search) {
    // Sanitize search input to prevent ReDoS attacks
    const sanitizedSearch = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: sanitizedSearch, $options: 'i' } },
      { email: { $regex: sanitizedSearch, $options: 'i' } },
    ];
  }
  if (status) {
    query.status = status;
  }

  try {
    const users = await User.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/users/:id/approve
// @desc    Approve a user
// @access  Private (Admin only)
router.put('/:id/approve', 
  auth,
  verifyRole('admin'),
  validateObjectId,
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Send approval email (don't block response on email)
      sendEmail(user.email, 'Account Approved', 'Your account has been approved. You can now log in.')
        .then(result => {
          if (result.success) {
            logger.info(`✓ Approval email sent to ${user.email}`);
          } else {
            logger.error(`✗ Failed to send approval email to ${user.email}:`, result.error);
          }
        })
        .catch(err => {
          logger.error(`✗ Error sending approval email to ${user.email}:`, err);
        });
      
      res.json(user);
    } catch (err) {
      logger.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  });

// @route   PUT api/users/:id/reject
// @desc    Reject a user
// @access  Private (Admin only)
router.put('/:id/reject', 
  auth,
  verifyRole('admin'),
  validateObjectId,
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Send rejection email (don't block response on email)
      sendEmail(user.email, 'Account Rejected', 'Your account has been rejected. Please contact an administrator for more information.')
        .then(result => {
          if (result.success) {
            logger.info(`✓ Rejection email sent to ${user.email}`);
          } else {
            logger.error(`✗ Failed to send rejection email to ${user.email}:`, result.error);
          }
        })
        .catch(err => {
          logger.error(`✗ Error sending rejection email to ${user.email}:`, err);
        });
      
      res.json(user);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE api/users/:id
// @desc    Soft delete a user
// @access  Private (Admin only)
router.delete('/:id', auth, verifyRole('admin'), validateObjectId, async (req, res) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user.id) {
    return res.status(400).json({ msg: 'You cannot delete your own account' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    
    // Check if user exists before trying to send email
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Send removal email (don't block response on email)
    sendEmail(user.email, 'Account Removed', 'Your account has been removed from the platform.')
      .then(result => {
        if (result.success) {
          logger.info(`✓ Account removal email sent to ${user.email}`);
        } else {
          logger.error(`✗ Failed to send removal email to ${user.email}:`, result.error);
        }
      })
      .catch(err => {
        logger.error(`✗ Error sending removal email to ${user.email}:`, err);
      });
    
    res.json({ msg: 'User removed' });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
