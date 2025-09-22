const nodemailer = require('nodemailer');

// Create multiple transporter configurations for failover
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 20000,
    debug: false, // Reduce debug spam
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Alternative SMTP configuration using Gmail's alternative ports
const createGmailBackupTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    debug: false,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Primary transporter
const transporter = createGmailTransporter();

// Debug environment variables (without exposing sensitive data)
console.log('Email configuration status:', {
  emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
  emailPass: process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET',
  nodeEnv: process.env.NODE_ENV || 'development'
});

// Skip verification at startup to avoid blocking server start
// Email connection will be tested when actually sending emails
console.log('Email service initialized with multiple fallback methods');

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

  // Try multiple transporter configurations
  const transporters = [
    { name: 'Gmail STARTTLS (587)', transporter: createGmailTransporter() },
    { name: 'Gmail SSL (465)', transporter: createGmailBackupTransporter() }
  ];
  
  let lastError = null;
  
  for (const { name, transporter: currentTransporter } of transporters) {
    try {
      console.log(`Attempting to send email to ${to} using ${name}`);
      const info = await currentTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to} using ${name}, messageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, method: name };
    } catch (err) {
      console.error(`Failed to send email using ${name}:`, err.message);
      lastError = err;
      
      // If it's not a connection/timeout error, don't try other methods
      if (err.code !== 'ETIMEDOUT' && err.code !== 'ECONNRESET' && err.code !== 'ENOTFOUND' && 
          !err.message.includes('timeout') && !err.message.includes('connection')) {
        console.log('Non-connection error detected, skipping other transporters');
        break;
      }
    }
  }
  
  // If all methods failed, log details and return error
  console.error('All email sending methods failed. Last error:', {
    message: lastError?.message,
    code: lastError?.code,
    emailConfigured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
  });
  
  return { 
    success: false, 
    error: lastError?.message || 'Unknown email error', 
    code: lastError?.code 
  };
};

module.exports = { sendEmail };
