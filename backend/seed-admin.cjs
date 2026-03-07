/**
 * Admin Seed Script
 * 
 * Creates an admin user in the database.
 * Usage: node seed-admin.cjs
 * 
 * You can customise via environment variables or edit the defaults below.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, 'src', 'config', 'config.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User.cjs');

const ADMIN_NAME  = process.env.ADMIN_NAME  || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bookspace.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'Admin@123';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    // Check if an admin already exists with this email
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin with email "${ADMIN_EMAIL}" already exists (role: ${existing.role}, status: ${existing.status}). Skipping.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASS, salt);

    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    await admin.save();
    console.log(`Admin user created successfully!`);
    console.log(`  Name : ${ADMIN_NAME}`);
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Pass : ${ADMIN_PASS}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
}

seed();
