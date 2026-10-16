// Employee Management System. This is where the Express server starts up.
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { attachUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
if (process.env.EMS_TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'" });
  next();
});

// Use EJS for views and serve everything in /public as static files.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Read form posts, JSON bodies and cookies.
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.get('origin');
    if (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== `${req.protocol}://${req.get('host')}`)) return res.status(403).json({ error: 'Cross-origin requests are not allowed.' });
    if (req.path.startsWith('/api/') && !req.is('application/json')) return res.status(415).json({ error: 'API requests must use application/json.' });
    if (req.path.startsWith('/api/') && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return res.status(400).json({ error: 'A JSON object is required.' });
  }
  res.set('Cache-Control', 'no-store');
  next();
});

// Work out who is logged in before any route runs.
app.use(attachUser);

// Routes.
app.use('/', require('./routes/pages'));
app.use('/', require('./routes/auth'));
app.use('/api/signup', require('./routes/api.signup'));
app.use('/api/employees', require('./routes/api.employees'));
app.use('/api/account', require('./routes/api.account'));

// Anything else is a 404.
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
  res.status(404).render('not-found');
});

// Return safe errors without disclosing credentials, input bodies or stack traces.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const storageError = error.code === 'EMS_STORAGE_ERROR';
  const invalidBody = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
  const status = storageError ? 503 : invalidBody ? (error.type === 'entity.too.large' ? 413 : 400) : 500;
  const message = storageError ? 'Account storage is unavailable. No changes were saved.' : invalidBody ? 'Invalid request body.' : 'Something went wrong. Please try again.';
  if (!invalidBody) console.error(storageError ? 'Account storage operation failed.' : 'Request failed.');
  if (req.path.startsWith('/api/')) return res.status(status).json({ error: message });
  return res.status(status).type('text').send(message);
});

// Only listen when run directly, so tests can import the app.
if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  app.listen(PORT, host, () => {
    console.log(`Employee Management System running at http://${host}:${PORT}`);
  });
}

module.exports = app;
