const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, init } = require('../database/db');

const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const STATUSES = ['new', 'in_contact', 'approved', 'archived'];
const CATEGORIES = ['Branding', '3D Assets', 'UI/UX', 'Motion Graphics', 'Print & Packaging'];
// Midpoint estimates used for the "estimated revenue" metric
const BUDGET_VALUE = { 'Under $500': 300, '$500 - $2,000': 1250, '$2,000 - $5,000': 3500, '$5,000+': 6000 };

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const fail = (res, msg, code = 400) => res.status(code).json({ error: msg });

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    fail(res, 'Unauthorized', 401);
  }
}

// ---------- Auth ----------
app.post('/api/auth/login', wrap(async (req, res) => {
  const username = str(req.body.username, 100);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await db('admin_users').where({ username }).first();
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return fail(res, 'Invalid username or password', 401);
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '8h' });
  res.json({ token, user: { username: user.username, role: user.role } });
}));

// ---------- Inquiries ----------
app.post('/api/inquiries', wrap(async (req, res) => {
  const b = req.body || {};
  const row = {
    client_name: str(b.client_name, 120),
    client_email: str(b.client_email, 160),
    service_type: str(b.service_type, 120),
    budget_range: str(b.budget_range, 60),
    project_brief: str(b.project_brief, 4000),
    deadline: str(b.deadline, 20) || null,
    status: 'new',
  };
  if (!row.client_name || !row.service_type || !row.project_brief) return fail(res, 'Name, service and project brief are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.client_email)) return fail(res, 'Enter a valid email address');
  const [id] = await db('inquiries').insert(row);
  res.status(201).json({ id, message: 'Inquiry received' });
}));

app.get('/api/inquiries', auth, wrap(async (req, res) => {
  const q = db('inquiries');
  if (STATUSES.includes(req.query.status)) q.where({ status: req.query.status });
  const dir = req.query.sort === 'asc' ? 'asc' : 'desc';
  res.json(await q.orderBy([{ column: 'created_at', order: dir }, { column: 'id', order: dir }]));
}));

app.get('/api/inquiries/:id', auth, wrap(async (req, res) => {
  const row = await db('inquiries').where({ id: req.params.id }).first();
  row ? res.json(row) : fail(res, 'Not found', 404);
}));

app.patch('/api/inquiries/:id/status', auth, wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return fail(res, 'Invalid status');
  const n = await db('inquiries').where({ id: req.params.id }).update({ status });
  if (!n) return fail(res, 'Not found', 404);
  res.json(await db('inquiries').where({ id: req.params.id }).first());
}));

app.get('/api/stats', auth, wrap(async (req, res) => {
  const rows = await db('inquiries').orderBy([{ column: 'created_at', order: 'desc' }, { column: 'id', order: 'desc' }]);
  const revenue = rows
    .filter((r) => r.status === 'approved' || r.status === 'archived')
    .reduce((sum, r) => sum + (BUDGET_VALUE[r.budget_range] || 0), 0);
  res.json({
    total: rows.length,
    active: rows.filter((r) => r.status === 'approved').length,
    completed: rows.filter((r) => r.status === 'archived').length,
    revenue,
    recent: rows.slice(0, 6),
  });
}));

// ---------- Portfolio ----------
function portfolioBody(b = {}) {
  return {
    title: str(b.title, 160),
    category: str(b.category, 60),
    client_name: str(b.client_name, 120),
    tag: str(b.tag, 60),
    description: str(b.description, 2000),
    image_url: str(b.image_url, 1000),
    featured: b.featured ? 1 : 0,
  };
}
const validPortfolio = (r) => (!r.title ? 'Title is required' : !CATEGORIES.includes(r.category) ? 'Choose a valid category' : null);
const asItem = (r) => r && { ...r, featured: !!r.featured };

app.get('/api/portfolio', wrap(async (req, res) => {
  const q = db('portfolio_items');
  if (CATEGORIES.includes(req.query.category)) q.where({ category: req.query.category });
  const rows = await q.orderBy([{ column: 'featured', order: 'desc' }, { column: 'id', order: 'desc' }]);
  res.json(rows.map(asItem));
}));

app.post('/api/portfolio', auth, wrap(async (req, res) => {
  const row = portfolioBody(req.body);
  const err = validPortfolio(row);
  if (err) return fail(res, err);
  const [id] = await db('portfolio_items').insert(row);
  res.status(201).json(asItem(await db('portfolio_items').where({ id }).first()));
}));

app.put('/api/portfolio/:id', auth, wrap(async (req, res) => {
  const row = portfolioBody(req.body);
  const err = validPortfolio(row);
  if (err) return fail(res, err);
  const n = await db('portfolio_items').where({ id: req.params.id }).update(row);
  if (!n) return fail(res, 'Not found', 404);
  res.json(asItem(await db('portfolio_items').where({ id: req.params.id }).first()));
}));

app.delete('/api/portfolio/:id', auth, wrap(async (req, res) => {
  const n = await db('portfolio_items').where({ id: req.params.id }).del();
  n ? res.status(204).end() : fail(res, 'Not found', 404);
}));

app.use('/api', (req, res) => fail(res, 'Not found', 404));

// ---------- Serve built client in production ----------
const dist = path.join(__dirname, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  fail(res, 'Server error', 500);
});

init().then(() => {
  app.listen(PORT, () => console.log(`Prism Shift Studio API running on http://localhost:${PORT}`));
});
