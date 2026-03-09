const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth.cjs');
const verifyRole = require('../middleware/verifyRole.cjs');
const logger = require('../utils/logger.cjs');

// Import all models
const User = require('../models/User.cjs');
const Place = require('../models/Place.cjs');
const Booking = require('../models/Booking.cjs');

const COLLECTIONS = {
  users: User,
  places: Place,
  bookings: Booking,
};

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'venue');

// Read all venue images from disk and return as { filename: base64 }
const exportVenueImages = () => {
  const images = {};
  if (!fs.existsSync(UPLOADS_DIR)) return images;
  const files = fs.readdirSync(UPLOADS_DIR);
  for (const file of files) {
    const filePath = path.join(UPLOADS_DIR, file);
    if (fs.statSync(filePath).isFile()) {
      images[file] = fs.readFileSync(filePath).toString('base64');
    }
  }
  return images;
};

// Write venue images from { filename: base64 } back to disk
const importVenueImages = (images) => {
  if (!images || typeof images !== 'object') return 0;
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  // Clear existing images
  const existing = fs.readdirSync(UPLOADS_DIR);
  for (const file of existing) {
    fs.unlinkSync(path.join(UPLOADS_DIR, file));
  }
  // Write new images
  let count = 0;
  for (const [filename, base64Data] of Object.entries(images)) {
    // Validate filename to prevent path traversal
    const safe = path.basename(filename);
    if (safe !== filename || filename.includes('..')) continue;
    fs.writeFileSync(path.join(UPLOADS_DIR, safe), Buffer.from(base64Data, 'base64'));
    count++;
  }
  return count;
};

// @route   GET api/db/export
// @desc    Export entire database as JSON
// @access  Private/Admin
router.get('/export', auth, verifyRole('superadmin'), async (req, res) => {
  try {
    logger.info('Database export requested by admin:', req.user.id);

    const data = {};
    for (const [name, Model] of Object.entries(COLLECTIONS)) {
      data[name] = await Model.find().lean();
    }

    // Bundle venue images as base64
    const venueImages = exportVenueImages();
    logger.info(`Exported ${Object.keys(venueImages).length} venue image(s)`);

    const exportPayload = {
      _meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.id,
        version: '1.1',
        collections: Object.keys(data).reduce((acc, key) => {
          acc[key] = data[key].length;
          return acc;
        }, {}),
        imageCount: Object.keys(venueImages).length,
      },
      data,
      venueImages,
    };

    const filename = `bookspace-backup-${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportPayload);

    logger.info('Database export completed successfully');
  } catch (err) {
    logger.error('Database export failed:', err.message);
    res.status(500).json({ msg: 'Failed to export database' });
  }
});

// @route   POST api/db/import
// @desc    Import database from JSON file
// @access  Private/Admin
router.post('/import', auth, verifyRole('superadmin'), express.json({ limit: '50mb' }), async (req, res) => {
  try {
    logger.info('Database import requested by admin:', req.user.id);

    const { _meta, data, venueImages } = req.body;

    // Validate structure
    if (!_meta || !data || typeof data !== 'object') {
      return res.status(400).json({ msg: 'Invalid backup file format. Must contain _meta and data fields.' });
    }

    if (!['1.0', '1.1'].includes(_meta.version)) {
      return res.status(400).json({ msg: `Unsupported backup version: ${_meta.version}. Expected 1.0 or 1.1.` });
    }

    // Validate that only known collections are present
    const knownCollections = Object.keys(COLLECTIONS);
    const providedCollections = Object.keys(data);
    const unknownCollections = providedCollections.filter(c => !knownCollections.includes(c));
    if (unknownCollections.length > 0) {
      return res.status(400).json({ msg: `Unknown collections in backup: ${unknownCollections.join(', ')}` });
    }

    // Validate each collection is an array
    for (const [name, records] of Object.entries(data)) {
      if (!Array.isArray(records)) {
        return res.status(400).json({ msg: `Collection "${name}" must be an array` });
      }
    }

    const currentAdminId = req.user.id;
    const results = {};

    try {
      for (const [name, Model] of Object.entries(COLLECTIONS)) {
        const records = data[name];
        if (!records || records.length === 0) {
          results[name] = { cleared: 0, imported: 0 };
          continue;
        }

        if (name === 'users') {
          // Preserve the currently logged-in admin account
          const deleteResult = await Model.deleteMany(
            { _id: { $ne: currentAdminId } }
          );

          // Filter out the current admin from the import to avoid duplicate key errors
          // Also filter out entries with the same email as the current admin
          const currentAdmin = await Model.findById(currentAdminId).lean();
          const filteredRecords = records.filter(
            (r) => String(r._id) !== String(currentAdminId) &&
                   r.email !== currentAdmin?.email
          );

          if (filteredRecords.length > 0) {
            await Model.insertMany(filteredRecords, { ordered: false });
          }

          results[name] = {
            cleared: deleteResult.deletedCount,
            imported: filteredRecords.length,
            preserved: 'Current admin account kept',
          };
        } else {
          // Clear and replace all other collections
          const deleteResult = await Model.deleteMany({});
          await Model.insertMany(records, { ordered: false });

          results[name] = {
            cleared: deleteResult.deletedCount,
            imported: records.length,
          };
        }
      }

      // Restore venue images from backup
      let imagesRestored = 0;
      if (venueImages && typeof venueImages === 'object') {
        imagesRestored = importVenueImages(venueImages);
        logger.info(`Restored ${imagesRestored} venue image(s)`);
      }

      logger.info('Database import completed successfully:', results);

      res.json({
        msg: 'Database imported successfully',
        results,
        imagesRestored,
        importedAt: new Date().toISOString(),
      });
    } catch (importErr) {
      logger.error('Database import failed:', importErr.message);
      res.status(500).json({ msg: 'Import partially failed: ' + importErr.message });
    }
  } catch (err) {
    logger.error('Database import failed:', err.message);
    res.status(500).json({ msg: 'Failed to import database' });
  }
});

module.exports = router;
