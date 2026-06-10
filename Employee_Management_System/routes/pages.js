// The pages people actually visit in the browser.
const express = require('express');
const router = express.Router();
const { requireAdmin, requireEmployee } = require('../middleware/auth');
const { getEmployees, toPublic } = require('../lib/db');

// Send already-logged-in users straight to their dashboard.
function dashboardFor(role) {
  return role === 'admin' ? '/admin/dashboard' : '/';
}

// One login page and one signup page, each with an employee/admin selector.
router.get('/login', (req, res) => {
  if (req.account) return res.redirect(dashboardFor(req.role));
  res.render('login', { error: null, values: { role: 'employee' } });
});

router.get('/signup', (req, res) => {
  if (req.account) return res.redirect(dashboardFor(req.role));
  res.render('signup', { error: null, values: { role: 'employee' } });
});

// Admin dashboard. Admins only.
router.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.render('admin/dashboard', {
    account: toPublic(req.account, req.role),
    employees: getEmployees(),
  });
});

// Employee dashboard at the site root. Employees only.
router.get('/', requireEmployee, (req, res) => {
  res.render('employee/dashboard', {
    account: toPublic(req.account, req.role),
    employees: getEmployees(),
  });
});

module.exports = router;
