const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking.cjs');
const { sendEmail } = require('../utils/email.cjs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } = require('docx');
const moment = require('moment');
const logger = require('../utils/logger.cjs');

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid booking ID format' });
  }
  next();
};

// @route   POST api/bookings/check-availability
// @desc    Check if a place is available for a given time range
// @access  Public
router.post('/check-availability', [
  body('placeId').isMongoId().withMessage('Invalid place ID'),
  body('eventStartTime').isISO8601().withMessage('Invalid start time format'),
  body('eventEndTime').isISO8601().withMessage('Invalid end time format')
], async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { placeId, eventStartTime, eventEndTime } = req.body;

  try {
    const newEventStartTime = new Date(eventStartTime);
    const newEventEndTime = new Date(eventEndTime);

    // Validate dates are valid
    if (isNaN(newEventStartTime.getTime()) || isNaN(newEventEndTime.getTime())) {
      return res.status(400).json({ msg: 'Invalid date format' });
    }

    // Validate end time is after start time
    if (newEventEndTime <= newEventStartTime) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }

    // BUG-018: Validate booking is not in the past
    if (newEventStartTime <= new Date()) {
      return res.status(400).json({ msg: 'Booking start time must be in the future' });
    }

    // BUG-019: Validate booking is within 90 days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (newEventStartTime > maxDate) {
      return res.status(400).json({ msg: 'Bookings cannot be made more than 90 days in advance' });
    }

    // BUG-016: Add 30-minute buffer around the requested time
    const bufferMs = 30 * 60 * 1000; // 30 minutes
    const bufferedStart = new Date(newEventStartTime.getTime() - bufferMs);
    const bufferedEnd = new Date(newEventEndTime.getTime() + bufferMs);

    // BUG-017: Include both approved AND pending bookings in overlap check
    const overlappingBookings = await Booking.find({
      placeId,
      status: { $in: ['approved', 'pending'] },
      $or: [
        { eventStartTime: { $lt: bufferedEnd, $gte: bufferedStart } },
        { eventEndTime: { $lte: bufferedEnd, $gt: bufferedStart } },
        { eventStartTime: { $lte: bufferedStart }, eventEndTime: { $gte: bufferedEnd } },
        { eventStartTime: { $gte: bufferedStart }, eventEndTime: { $lte: bufferedEnd } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.json({ available: false, msg: 'Place is not available during this time.' });
    } else {
      return res.json({ available: true, msg: 'Place is available.' });
    }
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
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

  // Use a session for atomic operation to prevent race conditions
  const session = await Booking.startSession();
  
  try {
    session.startTransaction();
    
    const newEventStartTime = new Date(eventStartTime);
    const newEventEndTime = new Date(eventEndTime);

    // Validate booking is not in the past
    if (newEventStartTime <= new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Booking start time must be in the future' });
    }

    // Validate booking is within 90 days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (newEventStartTime > maxDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Bookings cannot be made more than 90 days in advance' });
    }

    // Add 30-minute buffer for gap between bookings
    const bufferMs = 30 * 60 * 1000;
    const bufferedStart = new Date(newEventStartTime.getTime() - bufferMs);
    const bufferedEnd = new Date(newEventEndTime.getTime() + bufferMs);

    // Check for overlapping bookings (approved AND pending) within the transaction
    const overlappingBookings = await Booking.find({
      placeId,
      status: { $in: ['approved', 'pending'] },
      $or: [
        { eventStartTime: { $lt: bufferedEnd, $gte: bufferedStart } },
        { eventEndTime: { $lte: bufferedEnd, $gt: bufferedStart } },
        { eventStartTime: { $lte: bufferedStart }, eventEndTime: { $gte: bufferedEnd } },
        { eventStartTime: { $gte: bufferedStart }, eventEndTime: { $lte: bufferedEnd } }
      ]
    }).session(session);

    if (overlappingBookings.length > 0) {
      await session.abortTransaction();
      session.endSession();
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

    const booking = await newBooking.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.json(booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/bookings/:id/status
// @desc    Update booking status (approve/reject)
// @access  Private/Admin
router.put('/:id/status', 
  auth, 
  verifyRole(['admin', 'superadmin']),
  validateObjectId,
  [
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
    body('reason').if(body('status').equals('rejected'))
      .notEmpty().withMessage('Rejection reason is required')
      .isLength({ max: 500 }).trim()
  ],
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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

    // --- Overlap check before approving ---
    if (status === 'approved') {
      const s = new Date(booking.eventStartTime);
      const e = new Date(booking.eventEndTime);

      const conflict = await Booking.findOne({
        _id: { $ne: id },
        placeId: booking.placeId._id,
        status: 'approved',
        $or: [
          { eventStartTime: { $lt: e }, eventEndTime: { $gt: s } }
        ]
      }).populate('userId', ['name', 'email']);

      if (conflict) {
        const cs = new Date(conflict.eventStartTime).toLocaleString();
        const ce = new Date(conflict.eventEndTime).toLocaleString();
        return res.status(409).json({
          msg: `Cannot approve: "${conflict.eventTitle}" (by ${conflict.userId?.name || 'another user'}) is already approved for this venue from ${cs} to ${ce}.`,
          conflict: {
            eventTitle: conflict.eventTitle,
            userName: conflict.userId?.name,
            userEmail: conflict.userId?.email,
            startTime: conflict.eventStartTime,
            endTime: conflict.eventEndTime
          }
        });
      }
    }
    // --- End overlap check ---

    booking.status = status;
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

    logger.info(`Sending email notification to user ${userName} (${userEmail}) about booking status change to: ${status}`);

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
        logger.info(`Sending notifications to ${booking.requestedFacilities.length} requested facilities`);
        
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
            
            logger.info(`Email to facility "${facility.name}" (${facility.email}): ${facilityEmailResult.success ? 'Sent' : 'Failed'}`);
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
      logger.error(`Warning: Failed to send email notification to user ${userEmail}: ${emailResults.user.error}`);
    }

    const failedFacilityEmails = emailResults.facilities.filter(result => !result.success);
    if (failedFacilityEmails.length > 0) {
      logger.error(`Warning: Failed to send email to ${failedFacilityEmails.length} facilities:`, 
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
    logger.error('Error updating booking status:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/bookings/:id
// @desc    Update a booking
// @access  Private
router.put('/:id', [
  auth,
  validateObjectId,
  body('eventTitle').optional().isLength({ min: 3, max: 100 }).trim().escape().withMessage('Event title must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).trim().escape().withMessage('Description must be less than 500 characters'),
  body('eventStartTime').optional().isISO8601().withMessage('Invalid start time format'),
  body('eventEndTime').optional().isISO8601().withMessage('Invalid end time format'),
  body('placeId').optional().isMongoId().withMessage('Invalid place ID'),
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

  const { eventTitle, description, eventStartTime, eventEndTime, placeId, requestedFacilities } = req.body;

  // Use a session for atomic operation to prevent race conditions
  const session = await Booking.startSession();

  try {
    session.startTransaction();

    let booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (booking.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Only pending bookings can be edited' });
    }

    const updatedEventStartTime = new Date(eventStartTime || booking.eventStartTime);
    const updatedEventEndTime = new Date(eventEndTime || booking.eventEndTime);
    const updatedPlaceId = placeId || booking.placeId;

    // Validate dates are valid
    if (isNaN(updatedEventStartTime.getTime()) || isNaN(updatedEventEndTime.getTime())) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Invalid date format' });
    }

    // Validate end time is after start time
    if (updatedEventEndTime <= updatedEventStartTime) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'End time must be after start time' });
    }

    // Check for overlapping approved bookings (exclude current booking) within the transaction
    const overlappingBookings = await Booking.find({
      _id: { $ne: booking._id },
      placeId: updatedPlaceId,
      status: 'approved',
      $or: [
        { eventStartTime: { $lt: updatedEventEndTime, $gte: updatedEventStartTime } },
        { eventEndTime: { $lte: updatedEventEndTime, $gt: updatedEventStartTime } },
        { eventStartTime: { $lte: updatedEventStartTime }, eventEndTime: { $gte: updatedEventEndTime } },
        { eventStartTime: { $gte: updatedEventStartTime }, eventEndTime: { $lte: updatedEventEndTime } }
      ]
    }).session(session);

    if (overlappingBookings.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Updated time overlaps with an existing approved booking for this place.' });
    }

    booking.eventTitle = eventTitle || booking.eventTitle;
    booking.description = description || booking.description;
    booking.eventStartTime = updatedEventStartTime;
    booking.eventEndTime = updatedEventEndTime;
    booking.placeId = updatedPlaceId;
    booking.requestedFacilities = requestedFacilities || booking.requestedFacilities;

    await booking.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json(booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error updating booking:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE api/bookings/:id
// @desc    Delete a booking
// @access  Private (owner or admin)
router.delete('/:id', auth, validateObjectId, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Allow deletion if user owns the booking OR is an admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Booking.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Booking removed' });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/bookings/my-bookings
// @desc    Get all bookings for the authenticated user
// @access  Private
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('userId', ['name', 'email'])
      .populate('placeId', ['name', 'location']);
    res.json(bookings);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
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
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/bookings/pending
// @desc    Get all pending bookings
// @access  Private (Admin only)
router.get('/pending', auth, verifyRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('userId', ['name', 'email'])
      .populate('placeId', ['name', 'location']);
    res.json(bookings);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/bookings/approved
// @desc    Get all approved bookings
// @access  Private (Admin only)
router.get('/approved', auth, verifyRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'approved' }).sort({ eventStartTime: -1 }).populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/bookings
// @desc    Get all bookings
// @access  Private (Admin only)
router.get('/', auth, verifyRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId', ['name', 'email']).populate('placeId', ['name']);
    res.json(bookings);
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/bookings/report
// @desc    Generate a report of bookings
// @access  Private/Admin
router.get('/report', auth, verifyRole(['admin', 'superadmin']), async (req, res) => {
  const { format, status, placeId, dateFrom, dateTo, search, sortKey, sortDirection } = req.query;

  try {
    let query = Booking.find();

    // Filtering
    if (status && status !== '') query = query.where('status').equals(status);
    if (placeId && placeId !== '') query = query.where('placeId').equals(placeId);
    
    // Date range filtering
    if (dateFrom && dateFrom !== '') {
      const start = moment(dateFrom).startOf('day');
      query = query.where('eventStartTime').gte(start);
    }
    if (dateTo && dateTo !== '') {
      const end = moment(dateTo).endOf('day');
      query = query.where('eventStartTime').lte(end);
    }

    // Sorting
    if (sortKey) {
      const sort = {};
      sort[sortKey] = sortDirection === 'descending' ? -1 : 1;
      query = query.sort(sort);
    }

    logger.info('Report generation triggered with filters:', { status, placeId, dateFrom, dateTo, search });

    let bookings = await query.populate('userId', 'name email').populate('placeId', 'name').exec();

    // Apply search filter after population (since we need to search in populated fields)
    if (search && search !== '') {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter(booking => 
        (booking.eventTitle && booking.eventTitle.toLowerCase().includes(searchLower)) ||
        (booking.userId?.name && booking.userId.name.toLowerCase().includes(searchLower)) ||
        (booking.userId?.email && booking.userId.email.toLowerCase().includes(searchLower)) ||
        (booking._id && booking._id.toString().toLowerCase().includes(searchLower))
      );
    }

    logger.info(`Found ${bookings.length} bookings to report.`);

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-report.pdf');
      doc.pipe(res);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Bookings Report', { align: 'center' });
      doc.moveDown(0.5);
      
      // Report metadata
      doc.fontSize(10).font('Helvetica');
      doc.text(`Generated: ${moment().format('MMMM DD, YYYY HH:mm')}`, { align: 'center' });
      if (status || placeId || dateFrom || dateTo || search) {
        doc.text('Filters Applied:', { align: 'center' });
        if (status) doc.text(`  Status: ${status}`, { align: 'center' });
        if (placeId) {
          const place = await require('../models/Place.cjs').findById(placeId);
          doc.text(`  Place: ${place?.name || placeId}`, { align: 'center' });
        }
        if (dateFrom && dateTo) {
          doc.text(`  Date Range: ${moment(dateFrom).format('YYYY-MM-DD')} to ${moment(dateTo).format('YYYY-MM-DD')}`, { align: 'center' });
        } else if (dateFrom) {
          doc.text(`  From Date: ${moment(dateFrom).format('YYYY-MM-DD')}`, { align: 'center' });
        } else if (dateTo) {
          doc.text(`  To Date: ${moment(dateTo).format('YYYY-MM-DD')}`, { align: 'center' });
        }
        if (search) doc.text(`  Search: "${search}"`, { align: 'center' });
      }
      doc.text(`Total Records: ${bookings.length}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = doc.y;
      const itemX = 50;
      const pageHeight = doc.page.height - 100; // Leave margin at bottom

      const drawRow = (y, items, isBold = false) => {
        let currentX = itemX;
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        items.forEach(item => {
          doc.fontSize(9).text(item.text, currentX, y, { 
            width: item.width, 
            align: 'left',
            ellipsis: true // Truncate long text
          });
          currentX += item.width;
        });
      };

      // Table headers
      const headers = [
        { text: 'Event', width: 95 },
        { text: 'Place', width: 70 },
        { text: 'User', width: 70 },
        { text: 'Start', width: 75 },
        { text: 'End', width: 75 },
        { text: 'Dur.', width: 40 },
        { text: 'Status', width: 50 },
      ];

      let y = tableTop;
      
      // Draw header
      drawRow(y, headers, true);
      doc.moveTo(itemX, y + 15).lineTo(itemX + 475, y + 15).stroke();
      y += 25;

      // Draw rows with pagination
      bookings.forEach((booking, index) => {
        // Check if we need a new page
        if (y > pageHeight) {
          doc.addPage();
          y = 50;
          // Redraw headers on new page
          drawRow(y, headers, true);
          doc.moveTo(itemX, y + 15).lineTo(itemX + 475, y + 15).stroke();
          y += 25;
        }

        // Calculate duration
        const duration = moment.duration(moment(booking.eventEndTime).diff(moment(booking.eventStartTime)));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const durationText = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;

        const items = [
          { text: booking.eventTitle || 'N/A', width: 95 },
          { text: booking.placeId?.name || 'N/A', width: 70 },
          { text: booking.userId?.name || 'N/A', width: 70 },
          { text: moment(booking.eventStartTime).format('MMM DD HH:mm'), width: 75 },
          { text: moment(booking.eventEndTime).format('MMM DD HH:mm'), width: 75 },
          { text: durationText, width: 40 },
          { text: booking.status || 'N/A', width: 50 },
        ];
        
        // Alternate row background for better readability
        if (index % 2 === 0) {
          doc.rect(itemX - 5, y - 2, 480, 20).fillOpacity(0.05).fill('#000000');
          doc.fillOpacity(1);
        }
        
        drawRow(y, items);
        y += 25;
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
          `Page ${i + 1} of ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();

    } else if (format === 'docx') {
      // Create DOCX document
      const docxDoc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: 'Bookings Report',
              heading: 'Heading1',
            }),
            new Paragraph({
              text: `Generated: ${moment().format('MMMM DD, YYYY HH:mm')}`,
            }),
            new Paragraph({
              text: `Total Records: ${bookings.length}`,
            }),
            new Paragraph({ text: '' }), // Spacer
            // Create table with booking data
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Event' })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Place' })] }),
                    new TableCell({ children: [new Paragraph({ text: 'User' })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Start' })] }),
                    new TableCell({ children: [new Paragraph({ text: 'End' })] }),
                    new TableCell({ children: [new Paragraph({ text: 'Status' })] }),
                  ],
                }),
                // Data rows
                ...bookings.map(booking => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: booking.eventTitle || 'N/A' })] }),
                    new TableCell({ children: [new Paragraph({ text: booking.placeId?.name || 'N/A' })] }),
                    new TableCell({ children: [new Paragraph({ text: booking.userId?.name || 'N/A' })] }),
                    new TableCell({ children: [new Paragraph({ text: moment(booking.eventStartTime).format('MMM DD HH:mm') })] }),
                    new TableCell({ children: [new Paragraph({ text: moment(booking.eventEndTime).format('MMM DD HH:mm') })] }),
                    new TableCell({ children: [new Paragraph({ text: booking.status || 'N/A' })] }),
                  ],
                })),
              ],
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(docxDoc);
      res.setHeader('Content-Disposition', 'attachment; filename=bookings-report.docx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(buffer);

    } else {
      res.status(400).send('Invalid format requested');
    }
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;