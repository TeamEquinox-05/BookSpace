const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking.cjs');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth.cjs');

// Nodemailer transporter (ensure these are loaded from config.env in a real app)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @route   POST api/bookings
// @desc    Create a booking
// @access  Private
router.post('/', auth, async (req, res) => {
  const { placeId, eventTitle, description, eventStartTime, eventEndTime, requestedFacilities } = req.body;

  try {
    const newBooking = new Booking({
      userId: req.user.id,
      placeId,
      eventTitle,
      description,
      eventStartTime,
      eventEndTime,
      requestedFacilities,
    });

    const booking = await newBooking.save();
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/bookings/:id/status
// @desc    Update booking status (approve/reject)
// @access  Private/Admin
router.put('/:id/status', async (req, res) => {
  console.log('Received status update request for booking:', req.params.id);
  const { status, reason } = req.body;
  const { id } = req.params;

  try {
    let booking = await Booking.findById(id).populate('userId', ['name', 'email']).populate('placeId', ['name']);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    console.log('Updating booking:', booking);
    booking.status = status;
    booking.eventTitle = booking.eventTitle; // Explicitly set to trigger validation check
    if (status === 'rejected') {
      booking.reason = reason; // Assuming you add a 'reason' field to your Booking model
    }

    await booking.save();
    console.log('Booking saved. Sending emails...');

    // Send email notifications
    const userEmail = booking.userId.email;
    const placeName = booking.placeId.name;
    const eventTitle = booking.eventTitle;
    console.log('User Email:', userEmail, 'Place Name:', placeName, 'Event Title:', eventTitle);

    if (status === 'approved') {
      // Email to user
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Booking Approved!',
        text: `Your booking for ${eventTitle} at ${placeName} has been approved.`,
      });
      console.log('User approval email sent.');

      // Email to facility handlers (granular)
      for (const facility of booking.requestedFacilities) {
        console.log('Sending facility email for:', facility);
        if (facility && facility.email) { // Ensure facility object and email exist
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: facility.email,
            subject: `Facility Booking: ${eventTitle} Approved for ${placeName}`,
            text: `The ${facility.name} at ${placeName} has been booked for ${eventTitle} from ${booking.eventStartTime.toLocaleString()} to ${booking.eventEndTime.toLocaleString()}.`,
          });
          console.log(`Facility email sent to ${facility.email}`);
        } else {
          console.warn(`Skipping email for malformed facility: ${JSON.stringify(facility)}`);
        }
      }

    } else if (status === 'rejected') {
      // Email to user with reason
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Booking Rejected',
        text: `Your booking for ${eventTitle} at ${placeName} has been rejected. Reason: ${reason}`,
      });
      console.log('User rejection email sent.');
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/bookings/:id
// @desc    Update a booking
// @access  Private
router.put('/:id', auth, async (req, res) => {
  console.log('Received PUT request for booking ID:', req.params.id);
  const { eventTitle, description, eventStartTime, eventEndTime, placeId, requestedFacilities } = req.body;

  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Ensure user owns the booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Only allow edits if booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ msg: 'Only pending bookings can be edited' });
    }

    booking.eventTitle = eventTitle || booking.eventTitle;
    booking.description = description || booking.description;
    booking.eventStartTime = eventStartTime || booking.eventStartTime;
    booking.eventEndTime = eventEndTime || booking.eventEndTime;
    booking.placeId = placeId || booking.placeId;
    booking.requestedFacilities = requestedFacilities || booking.requestedFacilities;

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error('Error updating booking:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/bookings/:id
// @desc    Delete a booking
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Ensure user owns the booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Booking.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/my-bookings
// @desc    Get all bookings for the authenticated user
// @access  Private
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('placeId', ['name', 'location']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/recent
// @desc    Get recent bookings
// @access  Private (now requires auth)
router.get('/recent', auth, async (req, res) => {
  try {
    // Fetch only bookings made by the authenticated user
    const bookings = await Booking.find({ userId: req.user.id }).sort({ requestedAt: -1 }).limit(5).populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/pending
// @desc    Get all pending bookings
// @access  Public (will be restricted to Admin later)
router.get('/pending', async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('userId', ['name', 'email'])
      .populate('placeId', ['name', 'location']);
    console.log('Pending Bookings fetched from DB:', bookings);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/approved
// @desc    Get all approved bookings
// @access  Public
router.get('/approved', async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'approved' }).sort({ eventStartTime: -1 }).populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings
// @desc    Get all bookings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;