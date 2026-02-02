const nodemailer = require('nodemailer');

// Email service using Nodemailer with Gmail SMTP
// Required environment variables:
//   EMAIL_USER - Gmail email address
//   EMAIL_PASS - Gmail App Password (not regular password)
//
// To get Gmail App Password:
//   1. Enable 2-Factor Authentication on your Google Account
//   2. Go to: https://myaccount.google.com/apppasswords
//   3. Generate a new App Password for "Mail"
//   4. Use that password in EMAIL_PASS

// Singleton transporter instance - created once and reused for efficiency
let transporter = null;

// Create Gmail transporter with optimal settings (singleton pattern)
const getTransporter = () => {
  // Return existing transporter if already created
  if (transporter) {
    return transporter;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('ERROR: EMAIL_USER and EMAIL_PASS must be set in environment variables');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    pool: true, // Use pooled connections for better performance
    maxConnections: 5, // Limit concurrent connections
    maxMessages: 100, // Messages per connection before reconnecting
    debug: false
  });

  return transporter;
};

// Debugging environment variables
console.log('Email service configuration:', {
  emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
  emailPass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
  service: 'Gmail SMTP (Nodemailer)'
});

// Validate email format before attempting to send
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send email using Nodemailer
const sendEmail = async (to, subject, text) => {
  // Validate email before sending
  if (!to || !isValidEmail(to)) {
    console.error(`Invalid email address: ${to}`);
    return {
      success: false,
      error: 'Invalid email address format',
      code: 'INVALID_EMAIL'
    };
  }

  // Create HTML version of the email
  const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1d4ed8;">${subject}</h2>
      <p>${text.replace(/\n/g, '<br>')}</p>
      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
        This is an automated message from BookSpace. Please do not reply to this email.
      </p>
    </div>`;

  // Get singleton transporter
  const emailTransporter = getTransporter();
  
  if (!emailTransporter) {
    console.error('Failed to create email transporter - check EMAIL_USER and EMAIL_PASS');
    return { 
      success: false, 
      error: 'Email service not configured. Please contact administrator.' 
    };
  }

  // Mail options
  const mailOptions = {
    from: `"BookSpace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    console.log(`Attempting to send email to ${to} using Gmail SMTP`);
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${to}, messageId: ${info.messageId}`);
    return { 
      success: true, 
      messageId: info.messageId, 
      method: 'Gmail SMTP (Nodemailer)' 
    };
  } catch (err) {
    console.error(`✗ Failed to send email to ${to}:`, {
      message: err.message,
      code: err.code,
    });
    
    return {
      success: false,
      error: err.message,
      code: err.code,
    };
  }
};

// Cleanup function for graceful shutdown
const closeTransporter = () => {
  if (transporter) {
    transporter.close();
    transporter = null;
    console.log('Email transporter closed');
  }
};

module.exports = { sendEmail, closeTransporter };