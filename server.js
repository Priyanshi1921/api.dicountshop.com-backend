import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2';     
import bcrypt from 'bcrypt';

const app = express();
app.use(cors({
  origin: 'https://pranshucoderr.netlify.app',  // tumhara frontend URL
  methods: ['GET','POST'],
  credentials: true
}));
app.use(bodyParser.json());

// In-memory OTP store
let otpStore = {};

// MySQL connection
const db = mysql.createConnection({
 host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
    process.exit(1);
  }
  console.log('✅ MySQL connected!');
});

// Email transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
     user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 DiscountShop API is running successfully priyanshu bhai ',
    version: '1.0.0',
    status: 'OK'
  });
});

// OTP generator
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();

  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 minutes expiry

  const mailOptions = {
    from: 'pranshupandayking15@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('Email Error:', error);
      return res.json({ success: false, error: error.message });
    }
    return res.json({ success: true, message: 'OTP sent successfully!' });
  });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.json({ verified: false, message: 'OTP not found bhai ' });

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.json({ verified: false, message: 'OTP expired new  l l ' });
  }

  if (record.otp === otp) {
    delete otpStore[email];
    return res.json({ verified: true, message: 'OTP verified successfully' });
  } else {
    return res.json({ verified: false, message: 'Invalid OTP' });
  }
});

// Register User
app.post('/register-user', async (req, res) => {
  const { fullName, email, mobile, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (fullName, email, mobile, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [fullName, email, mobile, hashedPassword], (err) => {
      if (err) {
        console.error('DB Insert Error:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      return res.json({ success: true, message: 'User registered successfully!' });
    });
  } catch (err) {
    console.error('Hash Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login User
app.post('/login-user', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ success: false, message: 'DB error' });
    }

    if (results.length === 0) {
      return res.json({ success: false, message: 'User not found' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res.json({ success: true, fullName: user.fullName });
    } else {
      return res.json({ success: false, message: 'Invalid email or password' });
    }
  });
});

// Search Offers
app.get('/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({ success: false, results: [] });
  }

  const sql = 'SELECT * FROM offers WHERE title LIKE ? OR details LIKE ?';
  const searchQuery = `%${q}%`;

  db.query(sql, [searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Search Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, results });
  });
});

// Get Offers by Store
app.get('/offersByStore', (req, res) => {
  const { store } = req.query;

  if (!store) {
    return res.json({ success: false, error: 'Store not provided' });
  }

  const query = `
    SELECT id, store, title, details, url, image
    FROM offers
    WHERE store = ?
  `;

  db.query(query, [store], (err, results) => {
    if (err) {
      console.error('DB Error:', err);
      return res.json({ success: false, error: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// Server Listen
app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));
