// Employee Management System. This is where the Express server starts up.
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { attachUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Use EJS for views and serve everything in /public as static files.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Read form posts, JSON bodies and cookies.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

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

// Only listen when we run this file directly, so tests can import the app.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Employee Management System running at http://localhost:${PORT}`);
  });
}

module.exports = app;
