const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking.cjs');
const Place = require('../models/Place.cjs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');
const logger = require('../utils/logger.cjs');

// @route   GET api/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/', auth, verifyRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // Get total places count
    const totalPlaces = await Place.countDocuments();
    
    // Get active bookings count - approved bookings that haven't ended yet (current or future)
    const now = new Date();
    const activeBookings = await Booking.countDocuments({ 
      status: 'approved',
      eventEndTime: { $gte: now } // Event end time is in the future or ongoing
    });
    
    // Get pending approvals count
    const pendingApprovals = await Booking.countDocuments({ status: 'pending' });

    // IST = UTC+5:30. Compute today's boundaries in IST so the count is correct for Indian users.
    const IST_OFFSET_MS = 330 * 60 * 1000;
    const nowUtc = Date.now();
    const startOfTodayIST = new Date(Math.floor((nowUtc + IST_OFFSET_MS) / 86400000) * 86400000 - IST_OFFSET_MS);
    const endOfTodayIST = new Date(startOfTodayIST.getTime() + 86400000 - 1);

    const todayBookings = await Booking.countDocuments({
      status: 'approved',
      $or: [
        { eventStartTime: { $gte: startOfTodayIST, $lte: endOfTodayIST } },
        { eventEndTime: { $gte: startOfTodayIST, $lte: endOfTodayIST } },
        { eventStartTime: { $lte: startOfTodayIST }, eventEndTime: { $gte: endOfTodayIST } }
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
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/stats/bookings-by-month
// @desc    Get bookings by month for the current year
// @access  Private/Admin
router.get('/bookings-by-month', auth, verifyRole(['admin', 'superadmin']), async (req, res) => {
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
          _id: { $month: { date: "$eventStartTime", timezone: "Asia/Kolkata" } },
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
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;