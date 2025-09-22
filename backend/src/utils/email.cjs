const nodemailer = require('nodemailer');

// Create multiple transporter configurations for maximum reliability
const createSendGridTransporter = () => {
  // Use SendGrid if API key is available
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
  return null;
};

const createGmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // Reduced timeout for faster failover
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: false
  });
};

// Alternative SMTP configuration using Gmail's SSL port
const createGmailSSLTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: false
  });
};

// Fallback using direct SMTP without specific service
const createGenericSMTPTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 25, // Standard SMTP port
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    debug: false
  });
};

// Debug environment variables (without exposing sensitive data)
console.log('Email service configuration:', {
  emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
  emailPass: process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET',
  sendGridKey: process.env.SENDGRID_API_KEY ? 'SET (length: ' + process.env.SENDGRID_API_KEY.length + ')' : 'NOT SET',
  nodeEnv: process.env.NODE_ENV || 'development'
});

// Count available transporters
let availableTransporters = 0;
if (process.env.SENDGRID_API_KEY) availableTransporters++;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) availableTransporters += 3; // Gmail has 3 fallback methods

console.log(`Email service initialized with ${availableTransporters} available transporter(s):`, {
  sendGrid: !!process.env.SENDGRID_API_KEY,
  gmail: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"BookSpace" <${process.env.EMAIL_USER || 'noreply@bookspace.app'}>`,
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

  // Build transporter list based on available configurations
  const transporters = [];
  
  // Add SendGrid if available (most reliable for hosting platforms)
  const sendGridTransporter = createSendGridTransporter();
  if (sendGridTransporter) {
    transporters.push({ name: 'SendGrid', transporter: sendGridTransporter });
  }
  
  // Add Gmail options if credentials are available
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporters.push(
      { name: 'Gmail STARTTLS (587)', transporter: createGmailTransporter() },
      { name: 'Gmail SSL (465)', transporter: createGmailSSLTransporter() },
      { name: 'Gmail Generic SMTP (25)', transporter: createGenericSMTPTransporter() }
    );
  }
  
  if (transporters.length === 0) {
    console.error('No email transporters configured');
    return { success: false, error: 'No email service configured' };
  }
  
  let lastError = null;
  
  for (const { name, transporter: currentTransporter } of transporters) {
    try {
      console.log(`Attempting to send email to ${to} using ${name}`);
      const info = await currentTransporter.sendMail(mailOptions);
      console.log(`✓ Email sent successfully to ${to} using ${name}, messageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, method: name };
    } catch (err) {
      console.error(`✗ Failed to send email using ${name}:`, {
        message: err.message,
        code: err.code,
        timeout: err.message.includes('timeout') || err.code === 'ETIMEDOUT'
      });
      lastError = err;
      
      // Continue to next transporter for any error (aggressive failover)
      continue;
    }
  }
  
  // If all methods failed, log comprehensive details
  console.error('All email sending methods failed:', {
    lastError: lastError?.message,
    lastCode: lastError?.code,
    transporterCount: transporters.length,
    hasGmailCreds: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
    hasSendGrid: !!process.env.SENDGRID_API_KEY,
    to: to
  });
  
  return { 
    success: false, 
    error: lastError?.message || 'All email services failed', 
    code: lastError?.code,
    transportersTried: transporters.length
  };
};

module.exports = { sendEmail };
