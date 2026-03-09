/**
 * Admin Seed Script
 * 
 * Creates a super admin and an admin user in the database.
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

const ADMIN_NAME  = process.env.ADMIN_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS  = process.env.ADMIN_PASS;

const ADMIN2_NAME  = process.env.ADMIN2_NAME  || 'Admin';
const ADMIN2_EMAIL = process.env.ADMIN2_EMAIL || 'admin@bookspace.com';
const ADMIN2_PASS  = process.env.ADMIN2_PASS  || 'admin123';

if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASS environment variables are required.');
  console.error('Set them in config.env or pass them as environment variables.');
  process.exit(1);
}

async function seedUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    // Update role if it changed
    if (existing.role !== role) {
      existing.role = role;
      await existing.save();
      console.log(`  Updated "${email}" role to ${role}`);
    } else {
      console.log(`  "${email}" already exists (role: ${existing.role}). Skipping.`);
    }
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    role,
    status: 'active',
  });

  await user.save();
  console.log(`  Created ${role}: ${name} (${email})`);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    console.log('\nSeeding Super Admin...');
    await seedUser({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASS, role: 'superadmin' });

    console.log('\nSeeding Admin...');
    await seedUser({ name: ADMIN2_NAME, email: ADMIN2_EMAIL, password: ADMIN2_PASS, role: 'admin' });

    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding:', err.message);
    process.exit(1);
  }
}

seed();
