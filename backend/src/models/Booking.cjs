const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'place'
  },
  eventTitle: {
    type: String,
    required: true
  },
  reason: {
    type: String
  },
  description: {
    type: String
  },
  eventStartTime: {
    type: Date,
    required: true
  },
  eventEndTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
  requestedFacilities: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true }
    }
  ],
  requestedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('booking', BookingSchema);
