require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Postgres pool (only create in non-test environments)
let pool;
if (process.env.NODE_ENV !== 'test') {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend (assumes HTML lives one level up)
app.use(express.static(path.join(__dirname, '..')));

// Serve main HTML at root (file has spaces in name)
app.get('/', (req, res) => {
  // Prefer `website.html` as the site's root page if it exists, otherwise fall back
  const siteRoot1 = path.join(__dirname, '..', 'website.html');
  const siteRoot2 = path.join(__dirname, '..', 'AA AND PARTNERS.html');
  if (fs.existsSync(siteRoot1)) return res.sendFile(siteRoot1);
  if (fs.existsSync(siteRoot2)) return res.sendFile(siteRoot2);
  res.status(404).send('Site root not found');
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Contact form: save to DB and send email
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message required' });
  }
  // If pool is not available (test env), return 503 for insert attempts
  if (!pool) {
    return res.status(503).json({ success: false, message: 'Database not available in test mode' });
  }

  const client = await pool.connect();
  try {
    const insertText = `INSERT INTO contacts(name, email, phone, service, message, created_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING id`;
    const result = await client.query(insertText, [name, email, phone || null, service || null, message]);

    // send emails if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      const adminMail = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New contact from ${name}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Service:</strong> ${service || 'N/A'}</p><p><strong>Message:</strong><br/>${message}</p>`
      };

      const userMail = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thanks for contacting AA & Partners',
        html: `<p>Dear ${name},</p><p>Thanks for reaching out. We'll contact you shortly.</p>`
      };

      await transporter.sendMail(adminMail);
      await transporter.sendMail(userMail);
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Simple chat endpoint (placeholder)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const text = (message || '').toLowerCase();
  let response = "Thanks for your message. For consultations please use the contact form.";
  if (text.includes('hi') || text.includes('hello')) response = 'Hello! How can we help with sports law today?';
  if (text.includes('contract')) response = 'We handle contract negotiations, sponsorships and related matters.';
  res.json({ response });
});

// Start
// Ensure DB has required table at startup
async function initDb() {
  const client = await pool.connect();
  try {
    const createTable = `
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        service VARCHAR(100),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW())
      );
    `;
    await client.query(createTable);
    console.log('Ensured contacts table exists');
  } catch (err) {
    console.error('Error initializing database schema:', err.message || err);
  } finally {
    client.release();
  }
}

if (process.env.NODE_ENV === 'test') {
  // In test mode, export app without starting server
  console.log('Server loaded in test mode');
} else {
  initDb().then(() => {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  }).catch(err => {
    console.error('Failed to initialize database, aborting start:', err);
    process.exit(1);
  });
}

module.exports = app;
