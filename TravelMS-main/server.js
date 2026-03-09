const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Format Date objects to YYYY-MM-DD strings
function fmtRow(row) {
  const out = { ...row };
  for (const k of Object.keys(out)) {
    if (out[k] instanceof Date) {
      out[k] = out[k].toISOString().split('T')[0];
    }
  }
  return out;
}

function fmt(rows) {
  return Array.isArray(rows) ? rows.map(fmtRow) : fmtRow(rows);
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    // Users with no password hash: use default "admin" for dev/demo
    const hash = user.password_hash || await bcrypt.hash('admin', 10);
    const valid = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : password === 'admin';

    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const { password_hash, ...safe } = user;
    res.json(fmtRow(safe));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── USERS ─────────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, role, phone_number, created_at FROM users ORDER BY user_id'
    );
    res.json(fmt(rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, email, role, phone_number, password } = req.body;
    const hash = password ? await bcrypt.hash(password, 10) : null;
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, role, phone_number, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, role, phone_number, hash]
    );
    res.json({ user_id: result.insertId, first_name, last_name, email, role, phone_number });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, role, phone_number, password } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET first_name=?, last_name=?, email=?, role=?, phone_number=?, password_hash=? WHERE user_id=?',
        [first_name, last_name, email, role, phone_number, hash, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET first_name=?, last_name=?, email=?, role=?, phone_number=? WHERE user_id=?',
        [first_name, last_name, email, role, phone_number, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TRIPS ─────────────────────────────────────────────────────────────────────
app.get('/api/trips', async (req, res) => {
  try {
    const { user_id } = req.query;
    const where = user_id ? 'WHERE t.user_id = ?' : '';
    const params = user_id ? [user_id] : [];
    const [rows] = await pool.query(
      `SELECT t.*, CONCAT(u.first_name,' ',u.last_name) AS user_name
       FROM trips t LEFT JOIN users u ON t.user_id = u.user_id
       ${where}
       ORDER BY t.trip_id`,
      params
    );
    res.json(fmt(rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/trips', async (req, res) => {
  try {
    const { user_id, destination, start_date, end_date, purpose, estimated_budget } = req.body;
    const [result] = await pool.query(
      'INSERT INTO trips (user_id, destination, start_date, end_date, purpose, status, estimated_budget) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, destination, start_date, end_date, purpose, 'Pending', estimated_budget]
    );
    res.json({ trip_id: result.insertId, ...req.body, status: 'Pending' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/trips/:id', async (req, res) => {
  try {
    const { user_id, destination, start_date, end_date, purpose, status, estimated_budget } = req.body;
    await pool.query(
      'UPDATE trips SET user_id=?, destination=?, start_date=?, end_date=?, purpose=?, status=?, estimated_budget=? WHERE trip_id=?',
      [user_id, destination, start_date, end_date, purpose, status, estimated_budget, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/trips/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await pool.query('UPDATE trips SET status=? WHERE trip_id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/trips/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trips WHERE trip_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── EXPENSES ──────────────────────────────────────────────────────────────────
app.get('/api/expenses', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, t.destination
       FROM expenses e LEFT JOIN trips t ON e.trip_id = t.trip_id
       ORDER BY e.expense_id`
    );
    res.json(fmt(rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { trip_id, user_id, category, amount, expense_date, description, receipt_url } = req.body;
    const [result] = await pool.query(
      'INSERT INTO expenses (trip_id, user_id, category, amount, expense_date, description, receipt_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trip_id, user_id, category, amount, expense_date, description, receipt_url]
    );
    res.json({ expense_id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { trip_id, user_id, category, amount, expense_date, description, receipt_url } = req.body;
    await pool.query(
      'UPDATE expenses SET trip_id=?, user_id=?, category=?, amount=?, expense_date=?, description=?, receipt_url=? WHERE expense_id=?',
      [trip_id, user_id, category, amount, expense_date, description, receipt_url, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE expense_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── REPORTS ───────────────────────────────────────────────────────────────────
app.get('/api/reports', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.destination, CONCAT(u.first_name,' ',u.last_name) AS generated_by_name
       FROM reports r
       LEFT JOIN trips t ON r.trip_id = t.trip_id
       LEFT JOIN users u ON r.generated_by = u.user_id
       ORDER BY r.report_id`
    );
    res.json(fmt(rows));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { trip_id, generated_by } = req.body;
    const [[{ total }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE trip_id=?',
      [trip_id]
    );
    const [result] = await pool.query(
      'INSERT INTO reports (trip_id, generated_by, total_expenses, report_status) VALUES (?, ?, ?, ?)',
      [trip_id, generated_by, total, 'Generated']
    );
    res.json({ report_id: result.insertId, trip_id, generated_by, total_expenses: total, report_status: 'Generated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE report_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`TravelMS API running on http://localhost:${PORT}`));
