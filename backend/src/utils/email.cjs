const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Email provider strategy notes:
// - Preferred: HTTP APIs (SendGrid, Resend, Mailgun) as many hosts block raw SMTP ports
// - Fallback: Gmail SMTP (may timeout on some hosts)
//
// Required/optional env vars per provider:
//   Common:
//     EMAIL_FROM (recommended) - verified sender (e.g., no-reply@yourdomain.com)
//     EMAIL_USER / EMAIL_PASS - Gmail credentials (App Password) for SMTP fallback
//   SendGrid:
//     SENDGRID_API_KEY
//   Resend:
//     RESEND_API_KEY
//   Mailgun:
//     MAILGUN_API_KEY, MAILGUN_DOMAIN (e.g., mg.yourdomain.com)

const getFromAddress = () => {
  // Prefer explicit EMAIL_FROM; fallback to EMAIL_USER; else a generic placeholder
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@bookspace.app';
};

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

// Debugging environment variables (summarized)
console.log('Email service configuration:', {
  emailFrom: process.env.EMAIL_FROM ? `${process.env.EMAIL_FROM}` : '(default)',
  emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
  emailPass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
  sendGridKey: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
  resendKey: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
  mailgun: process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN ? 'SET' : 'NOT SET'
});

// --- Provider: Resend HTTP API ---
const sendViaResend = async ({ to, subject, text, html }) => {
  if (!process.env.RESEND_API_KEY) return { used: false };
  const from = getFromAddress();
  try {
    console.log('Attempting to send email via Resend Web API');
    // Node 18+ has global fetch
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({ from, to, subject, html, text })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('✗ Failed to send email via Resend Web API:', res.status, res.statusText, body);
      return { used: true, success: false, error: `Resend: ${res.status} ${res.statusText}` };
    }
    console.log('✓ Email sent successfully via Resend Web API to:', to);
    return { used: true, success: true, method: 'Resend Web API' };
  } catch (err) {
    console.error('✗ Resend Web API error:', err.message);
    return { used: true, success: false, error: err.message };
  }
};

// --- Provider: Mailgun HTTP API ---
const sendViaMailgun = async ({ to, subject, text, html }) => {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) return { used: false };
  const from = getFromAddress();
  try {
    console.log('Attempting to send email via Mailgun Web API');
    const form = new URLSearchParams();
    form.append('from', from);
    form.append('to', to);
    form.append('subject', subject);
    form.append('text', text);
    form.append('html', html);

    const res = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')
      },
      body: form
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('✗ Failed to send email via Mailgun Web API:', res.status, res.statusText, body);
      return { used: true, success: false, error: `Mailgun: ${res.status} ${res.statusText}` };
    }
    console.log('✓ Email sent successfully via Mailgun Web API to:', to);
    return { used: true, success: true, method: 'Mailgun Web API' };
  } catch (err) {
    console.error('✗ Mailgun Web API error:', err.message);
    return { used: true, success: false, error: err.message };
  }
};

const sendEmail = async (to, subject, text) => {
  const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1d4ed8;">${subject}</h2>
      <p>${text.replace(/\n/g, '<br>')}</p>
      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
        This is an automated message from BookSpace. Please do not reply to this email.
      </p>
    </div>`;

  // Provider order: Resend -> SendGrid -> Mailgun -> Gmail SMTP fallbacks

  // 1) Resend Web API
  const r = await sendViaResend({ to, subject, text, html });
  if (r.used) {
    if (r.success) return { success: true, method: r.method };
    // else continue to next provider
  }

  // 2) SendGrid Web API
  if (process.env.SENDGRID_API_KEY) {
    console.log('Attempting to send email via SendGrid Web API');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to,
      from: getFromAddress(), // must be verified in SendGrid
      subject,
      text,
      html,
    };
    try {
      await sgMail.send(msg);
      console.log('✓ Email sent successfully via SendGrid Web API to:', to);
      return { success: true, method: 'SendGrid Web API' };
    } catch (error) {
      // Typical: 401 Unauthorized (credits exceeded or invalid sender)
      const body = error.response?.body;
      console.error('✗ Failed to send email via SendGrid Web API:', error.message || error.toString());
      if (body) console.error('SendGrid Error Response Body:', body);
      // continue
    }
  }

  // 3) Mailgun Web API
  const m = await sendViaMailgun({ to, subject, text, html });
  if (m.used) {
    if (m.success) return { success: true, method: m.method };
    // else continue
  }

  // 4) Nodemailer with Gmail (Fallback)
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