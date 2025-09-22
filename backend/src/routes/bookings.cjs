const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking.cjs');
const { sendEmail } = require('../utils/email.cjs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } = require('docx');
const moment = require('moment');

// @route   POST api/bookings/check-availability
// @desc    Check if a place is available for a given time range
// @access  Public
router.post('/check-availability', async (req, res) => {
  const { placeId, eventStartTime, eventEndTime } = req.body;

  try {
    const newEventStartTime = new Date(eventStartTime);
    const newEventEndTime = new Date(eventEndTime);

    const overlappingBookings = await Booking.find({
      placeId,
      status: 'approved',
      $or: [
        { eventStartTime: { $lt: newEventEndTime, $gte: newEventStartTime } },
        { eventEndTime: { $lte: newEventEndTime, $gt: newEventStartTime } },
        { eventStartTime: { $lte: newEventStartTime }, eventEndTime: { $gte: newEventEndTime } },
        { eventStartTime: { $gte: newEventStartTime }, eventEndTime: { $lte: newEventEndTime } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.json({ available: false, msg: 'Place is not available during this time.' });
    } else {
      return res.json({ available: true, msg: 'Place is available.' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/bookings
// @desc    Create a booking
// @access  Private
router.post('/', [
  auth,
  body('placeId').isMongoId().withMessage('Invalid place ID'),
  body('eventTitle').isLength({ min: 3, max: 100 }).trim().escape().withMessage('Event title must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).trim().escape().withMessage('Description must be less than 500 characters'),
  body('eventStartTime').isISO8601().withMessage('Invalid start time format'),
  body('eventEndTime').isISO8601().withMessage('Invalid end time format'),
  body('requestedFacilities').optional().isArray().withMessage('Facilities must be an array')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      msg: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { placeId, eventTitle, description, eventStartTime, eventEndTime, requestedFacilities } = req.body;

  try {
    const newEventStartTime = new Date(eventStartTime);
    const newEventEndTime = new Date(eventEndTime);

    const overlappingBookings = await Booking.find({
      placeId,
      status: 'approved',
      $or: [
        { eventStartTime: { $lt: newEventEndTime, $gte: newEventStartTime } },
        { eventEndTime: { $lte: newEventEndTime, $gt: newEventStartTime } },
        { eventStartTime: { $lte: newEventStartTime }, eventEndTime: { $gte: newEventEndTime } },
        { eventStartTime: { $gte: newEventStartTime }, eventEndTime: { $lte: newEventEndTime } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ msg: 'Booking overlaps with an existing approved booking for this place.' });
    }

    const newBooking = new Booking({
      userId: req.user.id,
      placeId,
      eventTitle,
      description,
      eventStartTime: newEventStartTime,
      eventEndTime: newEventEndTime,
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
router.put('/:id/status', auth, verifyRole('admin'), async (req, res) => {
  const { status, reason } = req.body;
  const { id } = req.params;

  try {
    // Get full details of the booking, including user info and place details with facilities
    let booking = await Booking.findById(id)
      .populate('userId', ['name', 'email'])
      .populate({
        path: 'placeId',
        select: 'name facilities', // Include facilities to get their emails
      });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    booking.status = status;
    booking.eventTitle = booking.eventTitle;
    if (status === 'rejected') {
      booking.reason = reason;
    }

    await booking.save();

    const userEmail = booking.userId.email;
    const userName = booking.userId.name;
    const placeName = booking.placeId.name;
    const eventTitle = booking.eventTitle;
    const startTime = new Date(booking.eventStartTime).toLocaleString();
    const endTime = new Date(booking.eventEndTime).toLocaleString();
    
    // Track email sending results
    const emailResults = {
      user: null,
      facilities: []
    };

    console.log(`Sending email notification to user ${userName} (${userEmail}) about booking status change to: ${status}`);

    // Send email to the user
    if (status === 'approved') {
      const emailText = `Hello ${userName},

Your booking request has been approved!

Event Details:
- Title: ${eventTitle}
- Venue: ${placeName}
- From: ${startTime}
- To: ${endTime}

Thank you for using BookSpace!`;

      emailResults.user = await sendEmail(userEmail, 'Booking Approved!', emailText);
      
      // If approved, send emails to the requested facilities
      if (booking.requestedFacilities && booking.requestedFacilities.length > 0) {
        console.log(`Sending notifications to ${booking.requestedFacilities.length} requested facilities`);
        
        // Use the facilities directly from the booking since they already contain emails
        const facilitiesToNotify = booking.requestedFacilities;

        // Send emails to each facility
        for (const facility of facilitiesToNotify) {
          if (facility.email) {
            const facilityEmailText = `Hello ${facility.name} Manager,

A new booking has been approved that may require your services.

Event Details:
- Title: ${eventTitle}
- Venue: ${placeName}
- From: ${startTime}
- To: ${endTime}
- Booked by: ${userName} (${userEmail})

${facility.message ? `Note: ${facility.message}` : ''}

Please prepare accordingly.

Thank you,
BookSpace Administration`;

            const facilityEmailResult = await sendEmail(
              facility.email,
              `New Booking Approved: ${eventTitle}`,
              facilityEmailText
            );

            emailResults.facilities.push({
              facility: facility.name,
              email: facility.email,
              success: facilityEmailResult.success,
              error: facilityEmailResult.error || null
            });
            
            console.log(`Email to facility "${facility.name}" (${facility.email}): ${facilityEmailResult.success ? 'Sent' : 'Failed'}`);
          }
        }
      }
    } else if (status === 'rejected') {
      const emailText = `Hello ${userName},

We regret to inform you that your booking request has been rejected.

Event Details:
- Title: ${eventTitle}
- Venue: ${placeName}
- From: ${startTime}
- To: ${endTime}

Reason for rejection: ${reason}

If you have any questions, please contact the administration.

Thank you for using BookSpace!`;

      emailResults.user = await sendEmail(userEmail, 'Booking Request Rejected', emailText);
    }

    // Log email sending results
    if (emailResults.user && !emailResults.user.success) {
      console.error(`Warning: Failed to send email notification to user ${userEmail}: ${emailResults.user.error}`);
    }

    const failedFacilityEmails = emailResults.facilities.filter(result => !result.success);
    if (failedFacilityEmails.length > 0) {
      console.error(`Warning: Failed to send email to ${failedFacilityEmails.length} facilities:`, 
        failedFacilityEmails.map(f => `${f.facility} (${f.email}): ${f.error}`).join(', '));
    }

    res.json({
      booking,
      emailResults: {
        userEmailSent: emailResults.user ? emailResults.user.success : false,
        facilitiesNotified: emailResults.facilities.length,
        facilitiesSuccess: emailResults.facilities.filter(r => r.success).length
      }
    });
  } catch (err) {
    console.error('Error updating booking status:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/bookings/:id
// @desc    Update a booking
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { eventTitle, description, eventStartTime, eventEndTime, placeId, requestedFacilities } = req.body;

  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ msg: 'Only pending bookings can be edited' });
    }

    const updatedEventStartTime = new Date(eventStartTime || booking.eventStartTime);
    const updatedEventEndTime = new Date(eventEndTime || booking.eventEndTime);

    booking.eventTitle = eventTitle || booking.eventTitle;
    booking.description = description || booking.description;
    booking.eventStartTime = updatedEventStartTime;
    booking.eventEndTime = updatedEventEndTime;
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
    const bookings = await Booking.find({ userId: req.user.id }).sort({ requestedAt: -1 }).limit(5).populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/pending
// @desc    Get all pending bookings
// @access  Private (Admin only)
router.get('/pending', auth, verifyRole('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('userId', ['name', 'email'])
      .populate('placeId', ['name', 'location']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/approved
// @desc    Get all approved bookings
// @access  Public
router.get('/approved', auth, verifyRole('admin'), async (req, res) => {
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
router.get('/', auth, verifyRole('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/report
// @desc    Generate a report of bookings
// @access  Private/Admin
router.get('/report', auth, verifyRole('admin'), async (req, res) => {
  const { format, status, placeId, date, sortKey, sortDirection } = req.query;

  try {
    let query = Booking.find();

    // Filtering
    if (status && status !== '') query = query.where('status').equals(status);
    if (placeId && placeId !== '') query = query.where('placeId').equals(placeId);
    if (date && date !== '') {
      const start = moment(date).startOf('day');
      const end = moment(date).endOf('day');
      query = query.where('eventStartTime').gte(start).lte(end);
    }

    // Sorting
    if (sortKey) {
      const sort = {};
      sort[sortKey] = sortDirection === 'descending' ? -1 : 1;
      query = query.sort(sort);
    }

    console.log('Report generation triggered with filters:', { status, placeId, date });

    const bookings = await query.populate('userId', 'name').populate('placeId', 'name').exec();

    console.log(`Found ${bookings.length} bookings to report.`);

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-report.pdf');
      doc.pipe(res);

      doc.fontSize(20).text('Bookings Report', { align: 'center' });
      doc.moveDown();

      const tableTop = doc.y;
      const itemX = 50;

      const drawRow = (y, items) => {
        let currentX = itemX;
        items.forEach(item => {
          doc.fontSize(10).text(item.text, currentX, y, { width: item.width, align: 'left' });
          currentX += item.width;
        });
      };

      const headers = [
        { text: 'Event', width: 150 },
        { text: 'Place', width: 100 },
        { text: 'User', width: 100 },
        { text: 'Start Time', width: 120 },
        { text: 'Status', width: 80 },
      ];

      drawRow(tableTop, headers.map(h => ({...h, text: h.text.toUpperCase()})) );
      doc.moveTo(itemX, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      let y = tableTop + 25;
      bookings.forEach(booking => {
        const items = [
          { text: booking.eventTitle, width: 150 },
          { text: booking.placeId?.name || 'N/A', width: 100 },
          { text: booking.userId?.name || 'N/A', width: 100 },
          { text: moment(booking.eventStartTime).format('YYYY-MM-DD HH:mm'), width: 120 },
          { text: booking.status, width: 80 },
        ];
        drawRow(y, items);
        y += 25;
      });

      doc.end();

    } else if (format === 'docx') {
      // ... DOCX generation logic ...
      const buffer = await Packer.toBuffer(doc);
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-report.docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);

    } else {
      res.status(400).send('Invalid format requested');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;