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
  date: {
    type: Date,
    default: Date.now
  },
  resetPasswordOtp: String,
  resetPasswordOtpExpires: Date
});

module.exports = mongoose.model('user', UserSchema);
