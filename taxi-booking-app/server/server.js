const { validateDatabase, bookingFingerprint } = require('./schema');
const path = require('node:path');
const { createBase, fail, text, email, password, integer, hash, verify, id } = require('./security');
function createApp(options = {}) {
  const base = createBase({ dbPath: options.dbPath || process.env.DB_PATH || path.join(__dirname, 'database.json'), examplePath: path.join(__dirname, 'database.example.json'), collections: ['users', 'bookings', 'drivers', 'rideServices'], cookieName: 'taxi_session', validate: validateDatabase });
  const { app, read, write, auth, issue, revoke, limit } = base;
  const publicUser = u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, age: u.age });
  function own(req) { if (req.params.userId !== req.user.id) fail(403, 'This account is not yours'); }
  app.post('/api/auth/signup', limit, (req, res) => {
    const normalized = email(req.body.email), db = read();
    if (db.users.some(u => u.email === normalized)) fail(409, 'Email already registered');
    const user = { id: id(), email: normalized, passwordHash: hash(password(req.body.password)), firstName: text(req.body.firstName, 'First name'), lastName: text(req.body.lastName, 'Last name'), age: integer(req.body.age, 'Age', 16, 120), createdAt: new Date().toISOString() };
    db.users.push(user); write(db); issue(req, res, user.id); res.status(201).json({ success: true, user: publicUser(user) });
  });
  app.post('/api/auth/login', limit, (req, res) => {
    const normalized = email(req.body.email), user = read().users.find(u => u.email === normalized);
    if (!user || !verify(req.body.password, user.passwordHash)) fail(401, 'Invalid email or password');
    issue(req, res, user.id); res.json({ success: true, user: publicUser(user) });
  });
  app.get('/api/auth/session', auth, (req, res) => res.json({ user: publicUser(req.user) }));
  app.get('/api/auth/profile/:userId', auth, (req, res) => { own(req); res.json(publicUser(req.user)); });
  app.put('/api/auth/profile/:userId', auth, (req, res) => {
    own(req); const db = read(), user = db.users.find(u => u.id === req.user.id);
    Object.assign(user, { firstName: text(req.body.firstName, 'First name'), lastName: text(req.body.lastName, 'Last name'), age: integer(req.body.age, 'Age', 16, 120) });
    write(db); res.json({ success: true, user: publicUser(user) });
  });
  app.put('/api/auth/change-password/:userId', auth, limit, (req, res) => {
    own(req); const db = read(), user = db.users.find(u => u.id === req.user.id);
    if (!verify(req.body.currentPassword, user.passwordHash)) fail(401, 'Current password is incorrect');
    user.passwordHash = hash(password(req.body.newPassword)); write(db); revoke(user.id); issue(req, res, user.id); res.json({ success: true });
  });
  app.delete('/api/auth/account/:userId', auth, limit, (req, res) => {
    own(req); const db = read();
    if (!verify(req.body.password, req.user.passwordHash)) fail(401, 'Password is incorrect');
    db.users = db.users.filter(u => u.id !== req.user.id); db.bookings = db.bookings.filter(b => b.userId !== req.user.id);
    write(db); revoke(req.user.id); res.clearCookie('taxi_session', { path: '/api' }); res.json({ success: true });
  });
  app.get('/api/services', (req, res) => res.json(read().rideServices));
  app.get('/api/drivers', (req, res) => res.json(read().drivers));
  app.get('/api/bookings', auth, (req, res) => res.json(read().bookings.filter(b => b.userId === req.user.id)));
  function booking(req, db) { const row = db.bookings.find(b => b.id === req.params.id && b.userId === req.user.id); if (!row) fail(404, 'Booking not found'); return row; }
  app.get('/api/bookings/:id', auth, (req, res) => res.json(booking(req, read())));
  app.post('/api/bookings', auth, (req, res) => {
    const db = read();
    const requestId = text(req.body.requestId, 'Request ID', 36).toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) fail(400, 'A UUID request ID is required');
    const pickup = text(req.body.pickupLocation, 'Pickup', 300, 2), dropoff = text(req.body.dropoffLocation, 'Dropoff', 300, 2);
    if (pickup.toLowerCase() === dropoff.toLowerCase()) fail(400, 'Pickup and dropoff must differ');
    const rawDate = text(req.body.dateTime, 'Pickup date', 40);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(rawDate) || !Number.isFinite(Date.parse(rawDate)) || new Date(rawDate).toISOString() !== rawDate) fail(400, 'Use a valid ISO-UTC pickup date');
    const requested = { pickupLocation: pickup, dropoffLocation: dropoff, dateTime: rawDate, passengers: integer(req.body.passengers, 'Passengers', 1, 6), serviceType: text(req.body.serviceType, 'Service'), driverId: integer(req.body.driverId, 'Driver', 1, 1000000), specialRequests: req.body.specialRequests ? text(req.body.specialRequests, 'Special requests', 2000) : '' };
    const requestFingerprint = bookingFingerprint(requested);
    const existing = db.bookings.find(booking => booking.userId === req.user.id && booking.requestId === requestId);
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) fail(409, 'This request ID already belongs to a different booking; review My Bookings');
      return res.json({ success: true, booking: existing, replayed: true });
    }
    // Replays are resolved before time/catalog checks, so a saved confirmation remains retrievable later.
    if (Date.parse(rawDate) <= Date.now() || Date.parse(rawDate) > Date.now() + 366 * 86400000) fail(400, 'Use a future pickup date within one year');
    const service = db.rideServices.find(service => service.name === requested.serviceType);
    if (!service || requested.passengers > service.capacity) fail(400, 'Unknown service or passenger count exceeds capacity');
    const driver = db.drivers.find(driver => driver.id === requested.driverId && driver.serviceType === service.name);
    if (!driver) fail(400, 'Select a driver for this service');
    const row = { id: id(), userId: req.user.id, requestId, requestFingerprint, ...requested, typeOfService: service.name, driverName: driver.name, vehicleNumber: driver.vehicleNumber, price: driver.price, status: 'confirmed', timestamp: new Date().toISOString() };
    db.bookings.push(row); write(db); res.status(201).json({ success: true, booking: row, replayed: false });
  });
  // Customers can cancel upcoming rides; arbitrary price/owner/status updates are unsupported.
  app.delete('/api/bookings/:id', auth, (req, res) => {
    const db = read(), row = booking(req, db);
    if (row.status !== 'confirmed' || Date.parse(row.dateTime) <= Date.now()) fail(409, 'Only upcoming confirmed rides can be cancelled');
    row.status = 'cancelled'; write(db); res.json({ success: true, booking: row });
  });
  return base.finish();
}
if (require.main === module) createApp().listen(Number(process.env.PORT) || 3001, '127.0.0.1', () => console.log('Taxi API listening on loopback'));
module.exports = { createApp };
