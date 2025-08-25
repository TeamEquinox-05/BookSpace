const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  resetPasswordOtp: String,
  resetPasswordOtpExpires: Date
});

// Add indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('user', UserSchema);
