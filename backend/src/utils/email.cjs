const nodemailer = require('nodemailer');

// Create reusable transporter using OAuth2 or App Passwords
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Increase timeouts to handle slow responses
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  debug: true, // Enable debug output
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection is ready to accept messages');
  }
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"BookSpace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    // Add HTML version for better formatting
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1d4ed8;">${subject}</h2>
      <p>${text.replace(/\n/g, '<br>')}</p>
      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
        This is an automated message from BookSpace. Please do not reply to this email.
      </p>
    </div>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`ERROR: Failed to send email to ${to}:`, err);
    // Log additional details for debugging
    console.error('Email details:', {
      to,
      subject,
      emailUser: process.env.EMAIL_USER ? 'Configured' : 'Missing',
      emailPass: process.env.EMAIL_PASS ? 'Configured' : 'Missing',
    });
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
