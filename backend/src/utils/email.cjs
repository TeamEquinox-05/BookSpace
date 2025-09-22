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

// Debug environment variables (without exposing sensitive data)
console.log('Email configuration status:', {
  emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
  emailPass: process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET',
  nodeEnv: process.env.NODE_ENV || 'development'
});

// Verify connection configuration with better error handling
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP server connection error:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    console.error('Full SMTP error details:', error);
  } else {
    console.log('SMTP server connection is ready to accept messages');
  }
});

const sendEmail = async (to, subject, text, retryCount = 0) => {
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

  const maxRetries = 3;
  
  try {
    console.log(`Attempting to send email to ${to} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`ERROR: Failed to send email to ${to} (attempt ${retryCount + 1}):`, err.message);
    
    // Log additional details for debugging
    console.error('Email configuration status:', {
      to,
      subject,
      emailUser: process.env.EMAIL_USER ? 'Configured' : 'Missing',
      emailPass: process.env.EMAIL_PASS ? 'Configured' : 'Missing',
      host: 'smtp.gmail.com',
      port: 587
    });
    
    // Retry logic for timeout and connection errors
    if (retryCount < maxRetries && (
      err.code === 'ETIMEDOUT' || 
      err.code === 'ECONNRESET' || 
      err.code === 'ENOTFOUND' ||
      err.message.includes('timeout') ||
      err.message.includes('connection')
    )) {
      console.log(`Retrying email send in ${(retryCount + 1) * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return sendEmail(to, subject, text, retryCount + 1);
    }
    
    return { success: false, error: err.message, code: err.code };
  }
};

module.exports = { sendEmail };
