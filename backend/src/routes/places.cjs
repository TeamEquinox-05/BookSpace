const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const mongoose = require('mongoose');
const Place = require('../models/Place.cjs');
const Booking = require('../models/Booking.cjs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid place ID format' });
  }
  next();
};

// @route   POST api/places
// @desc    Create a new place
// @access  Private/Admin
router.post('/', 
  auth,
  verifyRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
    body('amenities').optional().isArray(),
    body('cost').isNumeric().withMessage('Cost must be a number'),
    body('description').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const newPlace = new Place(req.body);
      const place = await newPlace.save();
      res.json(place);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// @route   PUT api/places/:id
// @desc    Update a place
// @access  Private/Admin
router.put('/:id', 
  auth, 
  verifyRole('admin'),
  validateObjectId,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
    body('amenities').optional().isArray(),
    body('cost').optional().isNumeric().withMessage('Cost must be a number'),
    body('description').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let place = await Place.findById(req.params.id);
      if (!place) {
        return res.status(404).json({ msg: 'Place not found' });
      }
      place = await Place.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(place);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/places/:id
// @desc    Delete a place (only if no future bookings exist)
// @access  Private/Admin
router.delete('/:id', auth, verifyRole('admin'), validateObjectId, async (req, res) => {
  try {
    let place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ msg: 'Place not found' });
    }

    // Check for future or pending bookings for this place
    const now = new Date();
    const activeBookings = await Booking.countDocuments({
      placeId: req.params.id,
      $or: [
        { status: 'pending' },
        { status: 'approved', eventEndTime: { $gte: now } }
      ]
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        msg: `Cannot delete place with ${activeBookings} active or pending booking(s). Please cancel or wait for bookings to complete first.` 
      });
    }

    await Place.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Place removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/places/popular
// @desc    Get popular places
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const popularPlaces = await Booking.aggregate([
      { $group: { _id: '$placeId', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'places',
          localField: '_id',
          foreignField: '_id',
          as: 'placeDetails'
        }
      },
      {
        $unwind: '$placeDetails'
      },
      {
        $project: {
          _id: '$placeDetails._id',
          name: '$placeDetails.name',
          bookings: '$bookings',
          capacity: '$placeDetails.capacity'
        }
      }
    ]);
    res.json(popularPlaces);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/places/:id
// @desc    Get a single place by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ msg: 'Place not found' });
    }
    res.json(place);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/places
// @desc    Get all places
// @access  Public
router.get('/', async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/places/:id/bookings
// @desc    Get all bookings for a specific place
// @access  Private (requires authentication to protect user data)
router.get('/:id/bookings', auth, validateObjectId, async (req, res) => {
  try {
    const bookings = await Booking.find({ placeId: req.params.id })
      .populate('userId', ['name']) // Only expose name, not email for privacy
      .populate('placeId', ['name', 'location', 'capacity']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
