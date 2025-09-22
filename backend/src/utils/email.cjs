const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Gmail transporter functions (for fallback)
const createGmailTransporter = () => {
  return nodemailer.createTransport({
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
    debug: false
  });
};

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

const createGenericSMTPTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 25,
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

// Debugging environment variables
console.log('Email service configuration:', {
  emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
  emailPass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
  sendGridKey: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
});

const sendEmail = async (to, subject, text) => {
  const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1d4ed8;">${subject}</h2>
      <p>${text.replace(/\n/g, '<br>')}</p>
      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
        This is an automated message from BookSpace. Please do not reply to this email.
      </p>
    </div>`;

  // --- STRATEGY 1: SendGrid Web API (Primary) ---
  if (process.env.SENDGRID_API_KEY) {
    console.log('Attempting to send email via SendGrid Web API');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: to,
      from: process.env.EMAIL_USER || 'noreply@bookspace.app', // Note: SendGrid requires a verified sender
      subject: subject,
      text: text,
      html: html,
    };
    try {
      await sgMail.send(msg);
      console.log('✓ Email sent successfully via SendGrid Web API to:', to);
      return { success: true, method: 'SendGrid Web API' };
    } catch (error) {
      console.error('✗ Failed to send email via SendGrid Web API:', error.toString());
      if (error.response) {
        console.error('SendGrid Error Response Body:', error.response.body);
      }
      // Don't return yet, fall back to Nodemailer/Gmail
    }
  }

  // --- STRATEGY 2: Nodemailer with Gmail (Fallback) ---
  console.log('Falling back to Nodemailer with Gmail');
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('No Gmail credentials provided for fallback.');
    return { success: false, error: 'No email transporters configured' };
  }

  const mailOptions = {
    from: `"BookSpace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  const gmailTransporters = [
    { name: 'Gmail STARTTLS (587)', transporter: createGmailTransporter() },
    { name: 'Gmail SSL (465)', transporter: createGmailSSLTransporter() },
    { name: 'Gmail Generic SMTP (25)', transporter: createGenericSMTPTransporter() }
  ];

  let lastError = null;

  for (const { name, transporter } of gmailTransporters) {
    try {
      console.log(`Attempting to send email to ${to} using ${name}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✓ Email sent successfully to ${to} using ${name}, messageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, method: name };
    } catch (err) {
      console.error(`✗ Failed to send email using ${name}:`, {
        message: err.message,
        code: err.code,
      });
      lastError = err;
      continue;
    }
  }

  console.error('All email sending methods (SendGrid and Gmail) failed.');
  return {
    success: false,
    error: lastError?.message || 'All email services failed',
    code: lastError?.code,
  };
};

module.exports = { sendEmail };