const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',           // <-- yahan tumhara DB password (agar koi hai)
  database: 'myapp' // <-- yahan apne database ka naam likho
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL');
  }
});

// ✅ Yeh wahi tumhara route hai: Save user to MySQL
app.post('/save-user', (req, res) => {
  const { fullName, email, mobile, password } = req.body;
  const sql = 'INSERT INTO users (fullName, email, mobile, password) VALUES (?, ?, ?, ?)';
  db.query(sql, [fullName, email, mobile, password], (err, result) => {
    if (err) {
      console.error('Error saving user:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    return res.status(200).json({ success: true });
  });
});

// ✅ Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
