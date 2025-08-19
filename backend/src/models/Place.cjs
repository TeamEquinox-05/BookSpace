const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  details: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    default: 'available'
  },
  facilities: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      message: { type: String, required: true }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('place', PlaceSchema);
