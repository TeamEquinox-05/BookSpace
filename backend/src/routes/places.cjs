const express = require('express');
const router = express.Router();
const Place = require('../models/Place.cjs');
const Booking = require('../models/Booking.cjs');

// @route   POST api/places
// @desc    Create a new place
// @access  Private/Admin
router.post('/', async (req, res) => {
  try {
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
router.put('/:id', async (req, res) => {
  try {
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
// @desc    Delete a place
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    let place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ msg: 'Place not found' });
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
router.get('/:id', async (req, res) => {
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

module.exports = router;
