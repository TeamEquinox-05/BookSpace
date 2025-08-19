const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking.cjs');
const Place = require('../models/Place.cjs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');

// @route   GET api/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/', auth, verifyRole('admin'), async (req, res) => {
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

// @route   GET api/stats/bookings-by-month
// @desc    Get bookings by month for the current year
// @access  Private/Admin
router.get('/bookings-by-month', auth, verifyRole('admin'), async (req, res) => {
  try {
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          eventStartTime: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lt: new Date(new Date().getFullYear() + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$eventStartTime" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const chartData = months.map((month, index) => {
      const data = bookingsByMonth.find((item) => item._id === index + 1);
      return {
        name: month,
        bookings: data ? data.count : 0,
      };
    });

    res.json(chartData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;