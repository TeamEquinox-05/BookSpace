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
    // Get total places count
    const totalPlaces = await Place.countDocuments();
    
    // Get active (approved) bookings count
    const activeBookings = await Booking.countDocuments({ status: 'approved' });
    
    // Get pending approvals count
    const pendingApprovals = await Booking.countDocuments({ status: 'pending' });

    // Get today's bookings - bookings that are happening today (start or end date is today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todayBookings = await Booking.countDocuments({
      status: { $in: ['approved', 'confirmed'] },
      $or: [
        { eventStartTime: { $gte: startOfToday, $lte: endOfToday } },
        { eventEndTime: { $gte: startOfToday, $lte: endOfToday } },
        { eventStartTime: { $lte: startOfToday }, eventEndTime: { $gte: endOfToday } }
      ]
    });

    // Get total bookings count (all statuses)
    const totalBookings = await Booking.countDocuments();
    
    // Get rejected bookings count
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });

    res.json({
      totalPlaces: { value: totalPlaces },
      activeBookings: { value: activeBookings },
      pendingApprovals: { value: pendingApprovals },
      todayBookings: { value: todayBookings },
      totalBookings: { value: totalBookings },
      rejectedBookings: { value: rejectedBookings },
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