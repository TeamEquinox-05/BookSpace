const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking.cjs');
const Place = require('../models/Place.cjs');

// @route   GET api/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const totalPlaces = await Place.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'approved' });
    const pendingApprovals = await Booking.countDocuments({ status: 'pending' });

    // For simplicity, these are placeholders. A real implementation would involve more complex queries.
    const todayBookings = 0;
    const monthlyGrowth = '0%';
    const utilizationRate = '0%';
    const issuesReported = 0;

    res.json({
      totalPlaces: { value: totalPlaces, change: '' },
      activeBookings: { value: activeBookings, change: '' },
      pendingApprovals: { value: pendingApprovals, change: '' },
      todayBookings: { value: todayBookings, change: '' },
      monthlyGrowth: { value: monthlyGrowth, change: '' },
      utilizationRate: { value: utilizationRate, change: '' },
      issuesReported: { value: issuesReported, change: '' },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;