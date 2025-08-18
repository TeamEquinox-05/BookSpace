const express = require('express');
const router = express.Router();
const User = require('../models/User.cjs');
const auth = require('../middleware/auth.cjs');

// Placeholder email service
const sendEmail = (to, subject, text) => {
  console.log(`Sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text: ${text}`);
};

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users
// @desc    Get all users with pagination, search, and filtering
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  const { page = 1, limit = 10, search = '', status = '' } = req.query;

  const query = { isDeleted: false };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) {
    query.status = status;
  }

  try {
    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/approve
// @desc    Approve a user
// @access  Private (Admin only)
router.put('/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    sendEmail(user.email, 'Account Approved', 'Your account has been approved. You can now log in.');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/reject
// @desc    Reject a user
// @access  Private (Admin only)
router.put('/:id/reject', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    sendEmail(user.email, 'Account Rejected', 'Your account has been rejected. Please contact an administrator for more information.');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Soft delete a user
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    sendEmail(user.email, 'Account Removed', 'Your account has been removed from the platform.');
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
