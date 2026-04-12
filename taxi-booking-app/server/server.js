const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to database file
const dbPath = path.join(__dirname, 'database.json');

// Helper function to read database
function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { rideServices: [], drivers: [], bookings: [], users: [] };
  }
}

// Helper function to write database
function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Get all bookings
app.get('/api/bookings', (req, res) => {
  const db = readDatabase();
  res.json(db.bookings || []);
});

// Get a specific booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const db = readDatabase();
  const booking = (db.bookings || []).find(b => b.id === req.params.id);

  if (booking) {
    res.json(booking);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Create a new booking
app.post('/api/bookings', (req, res) => {
  const db = readDatabase();

  const newBooking = {
    id: `BOOKING_${Date.now()}`,
    ...req.body,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
  };

  if (!db.bookings) {
    db.bookings = [];
  }

  db.bookings.push(newBooking);

  if (writeDatabase(db)) {
    res.status(201).json({
      success: true,
      booking: newBooking,
      message: 'Booking saved successfully',
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to save booking',
    });
  }
});

// Update booking status
app.put('/api/bookings/:id', (req, res) => {
  const db = readDatabase();
  const bookingIndex = (db.bookings || []).findIndex(b => b.id === req.params.id);

  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  db.bookings[bookingIndex] = {
    ...db.bookings[bookingIndex],
    ...req.body,
  };

  if (writeDatabase(db)) {
    res.json({
      success: true,
      booking: db.bookings[bookingIndex],
    });
  } else {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete a booking
app.delete('/api/bookings/:id', (req, res) => {
  const db = readDatabase();
  const bookingIndex = (db.bookings || []).findIndex(b => b.id === req.params.id);

  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const deletedBooking = db.bookings.splice(bookingIndex, 1);

  if (writeDatabase(db)) {
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } else {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get all services
app.get('/api/services', (req, res) => {
  const db = readDatabase();
  res.json(db.rideServices || []);
});

// Get all drivers
app.get('/api/drivers', (req, res) => {
  const db = readDatabase();
  res.json(db.drivers || []);
});

// Authentication Endpoints

// Sign up - Create new user
app.post('/api/auth/signup', (req, res) => {
  const db = readDatabase();
  const { email, password, firstName, lastName } = req.body;

  // Validate input
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if user already exists
  const existingUser = (db.users || []).find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Create new user
  const newUser = {
    id: `USER_${Date.now()}`,
    email,
    password, // In production, this should be hashed
    firstName,
    lastName,
    age: null,
    createdAt: new Date().toISOString(),
  };

  if (!db.users) {
    db.users = [];
  }

  db.users.push(newUser);

  if (writeDatabase(db)) {
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      message: 'Account created successfully',
    });
  } else {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login - Authenticate user
app.post('/api/auth/login', (req, res) => {
  const db = readDatabase();
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user
  const user = (db.users || []).find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
    },
  });
});

// Get user profile
app.get('/api/auth/profile/:userId', (req, res) => {
  const db = readDatabase();
  const user = (db.users || []).find(u => u.id === req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    age: user.age,
  });
});

// Update user profile
app.put('/api/auth/profile/:userId', (req, res) => {
  const db = readDatabase();
  const userIndex = (db.users || []).findIndex(u => u.id === req.params.userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { firstName, lastName, age } = req.body;

  db.users[userIndex] = {
    ...db.users[userIndex],
    firstName: firstName !== undefined ? firstName : db.users[userIndex].firstName,
    lastName: lastName !== undefined ? lastName : db.users[userIndex].lastName,
    age: age !== undefined ? age : db.users[userIndex].age,
  };

  if (writeDatabase(db)) {
    res.json({
      success: true,
      user: {
        id: db.users[userIndex].id,
        email: db.users[userIndex].email,
        firstName: db.users[userIndex].firstName,
        lastName: db.users[userIndex].lastName,
        age: db.users[userIndex].age,
      },
    });
  } else {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
app.put('/api/auth/change-password/:userId', (req, res) => {
  const db = readDatabase();
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  const userIndex = (db.users || []).findIndex(u => u.id === req.params.userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  if (db.users[userIndex].password !== currentPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Update password
  db.users[userIndex].password = newPassword;

  if (writeDatabase(db)) {
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } else {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete account
app.delete('/api/auth/account/:userId', (req, res) => {
  const db = readDatabase();
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required for account deletion' });
  }

  const userIndex = (db.users || []).findIndex(u => u.id === req.params.userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify password
  if (db.users[userIndex].password !== password) {
    return res.status(401).json({ error: 'Password is incorrect' });
  }

  // Delete user
  const deletedUser = db.users.splice(userIndex, 1)[0];

  if (writeDatabase(db)) {
    res.json({
      success: true,
      message: 'Account deleted successfully',
      user: {
        id: deletedUser.id,
        email: deletedUser.email,
      },
    });
  } else {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Book a Taxi Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: ${dbPath}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/health                - Check server status`);
  console.log(`  GET  /api/bookings              - Get all bookings`);
  console.log(`  GET  /api/bookings/:id          - Get specific booking`);
  console.log(`  POST /api/bookings              - Create new booking`);
  console.log(`  PUT  /api/bookings/:id          - Update booking`);
  console.log(`  DELETE /api/bookings/:id        - Delete booking`);
  console.log(`  GET  /api/services              - Get all services`);
  console.log(`  GET  /api/drivers               - Get all drivers`);
  console.log(`  POST /api/auth/signup           - Create new account`);
  console.log(`  POST /api/auth/login            - Login user`);
  console.log(`  GET  /api/auth/profile/:userId  - Get user profile`);
  console.log(`  PUT  /api/auth/profile/:userId  - Update user profile`);
  console.log(`  PUT  /api/auth/change-password/:userId - Change password`);
  console.log(`  DELETE /api/auth/account/:userId - Delete account`);
});
