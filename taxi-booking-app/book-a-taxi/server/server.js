const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Core middleware for CORS and JSON body parsing.
app.use(cors());
app.use(express.json());

// Flat-file datastore path used for demo persistence.
const DB_PATH = path.join(__dirname, 'database.json');

// Read full database snapshot from local JSON file.
const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], bookings: [], services: [], drivers: [] };
  }
};

// Persist full database snapshot back to local JSON file.
const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database:', error);
  }
};

// Authentication endpoints.
app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, email, password, age } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 5) {
    return res.status(400).json({ error: 'Password must be at least 5 characters' });
  }

  const db = readDatabase();

  // Check if user already exists
  const existingUser = db.users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
    age: age ? parseInt(age, 10) : null,
    password, // In production, this should be hashed
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDatabase(db);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ user: userWithoutPassword });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDatabase();
  const user = db.users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.get('/api/auth/profile', (req, res) => {
  // In a real app, you'd get user ID from JWT token
  // For now, we'll assume the user is authenticated via localStorage on frontend
  res.status(401).json({ error: 'Authentication required' });
});

app.put('/api/auth/profile', (req, res) => {
  const { userId, firstName, lastName, age } = req.body;

  if (!userId || !firstName || !lastName || age === undefined || age === null || age === '') {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const parsedAge = parseInt(age, 10);
  if (Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return res.status(400).json({ error: 'Please enter a valid age' });
  }

  const db = readDatabase();

  // Find user by id (in real app, use user ID from token)
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update user
  db.users[userIndex] = {
    ...db.users[userIndex],
    firstName,
    lastName,
    age: parsedAge,
  };

  writeDatabase(db);

  const { password: _, ...userWithoutPassword } = db.users[userIndex];
  res.json({ user: userWithoutPassword });
});

app.put('/api/auth/password', (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'User, current password, and new password are required' });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'New password must be at least 5 characters' });
  }

  const db = readDatabase();

  // Find user by id and verify current password.
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (db.users[userIndex].password !== currentPassword) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // Update password
  db.users[userIndex].password = newPassword;
  writeDatabase(db);

  res.json({ message: 'Password updated successfully' });
});

app.delete('/api/auth/account', (req, res) => {
  const { userId, currentPassword } = req.body;

  if (!userId || !currentPassword) {
    return res.status(400).json({ error: 'User and current password are required' });
  }

  const db = readDatabase();

  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (db.users[userIndex].password !== currentPassword) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  db.users.splice(userIndex, 1);
  db.bookings = db.bookings.filter(booking => booking.userId !== userId);
  writeDatabase(db);

  res.json({ message: 'Account deleted successfully' });
});

// Booking CRUD endpoints.
app.get('/api/bookings', (req, res) => {
  const db = readDatabase();
  res.json(db.bookings);
});

app.post('/api/bookings', (req, res) => {
  const { userId, pickupLocation, dropoffLocation, dateTime, passengers, serviceType, typeOfService, price, specialRequests } = req.body;
  const normalizedServiceType = serviceType || typeOfService;

  if (!userId || !pickupLocation || !dropoffLocation || !dateTime || !passengers || !normalizedServiceType || !price) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  const db = readDatabase();

  const newBooking = {
    id: Date.now().toString(),
    userId,
    pickupLocation,
    dropoffLocation,
    dateTime,
    passengers: parseInt(passengers),
    serviceType: normalizedServiceType,
    typeOfService: normalizedServiceType,
    price: parseFloat(price),
    specialRequests: specialRequests || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.bookings.push(newBooking);
  writeDatabase(db);

  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.serviceType && !updates.typeOfService) {
    updates.typeOfService = updates.serviceType;
  }

  if (updates.typeOfService && !updates.serviceType) {
    updates.serviceType = updates.typeOfService;
  }

  const db = readDatabase();
  const bookingIndex = db.bookings.findIndex(booking => booking.id === id);

  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  db.bookings[bookingIndex] = { ...db.bookings[bookingIndex], ...updates };
  writeDatabase(db);

  res.json(db.bookings[bookingIndex]);
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  const db = readDatabase();
  const bookingIndex = db.bookings.findIndex(booking => booking.id === id);

  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  db.bookings.splice(bookingIndex, 1);
  writeDatabase(db);

  res.json({ message: 'Booking deleted successfully' });
});

// Services and drivers reference endpoints.
app.get('/api/services', (req, res) => {
  const db = readDatabase();
  res.json(db.services);
});

app.get('/api/drivers', (req, res) => {
  const db = readDatabase();
  res.json(db.drivers);
});

// Start HTTP server and print available route summary.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('POST /api/auth/signup - User registration');
  console.log('POST /api/auth/login - User login');
  console.log('PUT /api/auth/profile - Update profile');
  console.log('PUT /api/auth/password - Change password');
  console.log('DELETE /api/auth/account - Delete account');
  console.log('GET /api/bookings - Get all bookings');
  console.log('POST /api/bookings - Create booking');
  console.log('PUT /api/bookings/:id - Update booking');
  console.log('DELETE /api/bookings/:id - Delete booking');
  console.log('GET /api/services - Get services');
  console.log('GET /api/drivers - Get drivers');
});