function ensure(condition, label) { if (!condition) throw new Error(`Invalid database: ${label}`); }
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = (value, min = 1, max = 100) => typeof value === 'string' && value === value.trim() && value.length >= min && value.length <= max;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const email = value => string(value, 3, 254) && value === value.toLowerCase() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const hash = value => typeof value === 'string' && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(value);
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
function keys(value, required, optional = []) { return plain(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key)); }
function unique(rows, key, label) { ensure(new Set(rows.map(row => row[key])).size === rows.length, label); }

const { createHash } = require('node:crypto');
function bookingFingerprint(booking) {
  return createHash('sha256').update(JSON.stringify({ pickupLocation: booking.pickupLocation, dropoffLocation: booking.dropoffLocation, dateTime: booking.dateTime, passengers: booking.passengers, serviceType: booking.serviceType, driverId: booking.driverId, specialRequests: booking.specialRequests })).digest('hex');
}
function validateDatabase(db) {
  ensure(keys(db, ['users','bookings','drivers','rideServices']), 'top-level collections');
  for (const rows of Object.values(db)) ensure(Array.isArray(rows), 'collection type');
  for (const user of db.users) ensure(keys(user, ['id','email','passwordHash','firstName','lastName','age','createdAt']) && uuid(user.id) && email(user.email) && hash(user.passwordHash) && string(user.firstName) && string(user.lastName) && integer(user.age, 16, 120) && date(user.createdAt), 'user record');
  for (const service of db.rideServices) ensure(keys(service, ['id','name','description','basePrice','pricePerMile','pricePerMinute','icon','capacity','features']) && integer(service.id, 1, 1000000) && ['Economy','Comfort','Premium','XL'].includes(service.name) && string(service.description, 1, 1000) && number(service.basePrice, 0, 100000) && number(service.pricePerMile, 0, 100000) && number(service.pricePerMinute, 0, 100000) && string(service.icon, 1, 100) && integer(service.capacity, 1, 6) && Array.isArray(service.features) && service.features.length <= 30 && service.features.every(feature => string(feature, 1, 200)), 'service record');
  ensure(['Economy','Comfort','Premium','XL'].every(name => db.rideServices.some(service => service.name === name)), 'missing service catalog');
  for (const driver of db.drivers) {
    ensure(keys(driver, ['id','name','rating','reviews','vehicleType','vehicleNumber','serviceType','estimatedTime','avatar','price'], ['phone','email','yearsExperience']) && integer(driver.id, 1, 1000000) && string(driver.name) && number(driver.rating, 0, 5) && integer(driver.reviews, 0, 1000000) && string(driver.vehicleType) && string(driver.vehicleNumber, 1, 40) && string(driver.estimatedTime) && string(driver.avatar, 1, 100) && number(driver.price, 0.01, 100000) && Math.abs(driver.price * 100 - Math.round(driver.price * 100)) < 0.000001, 'driver record');
    ensure(!Object.hasOwn(driver, 'phone') || string(driver.phone, 1, 30), 'driver phone');
    ensure(!Object.hasOwn(driver, 'email') || email(driver.email), 'driver email');
    ensure(!Object.hasOwn(driver, 'yearsExperience') || integer(driver.yearsExperience, 0, 100), 'driver experience');
    ensure(db.rideServices.some(service => service.name === driver.serviceType), 'driver service reference');
  }
  ensure(db.rideServices.every(service => db.drivers.some(driver => driver.serviceType === service.name)), 'missing service fleet');
  for (const booking of db.bookings) {
    ensure(keys(booking, ['id','userId','requestId','requestFingerprint','pickupLocation','dropoffLocation','dateTime','passengers','serviceType','typeOfService','driverId','driverName','vehicleNumber','price','specialRequests','status','timestamp']) && uuid(booking.id) && uuid(booking.userId) && uuid(booking.requestId) && typeof booking.requestFingerprint === 'string' && /^[0-9a-f]{64}$/.test(booking.requestFingerprint) && string(booking.pickupLocation, 2, 300) && string(booking.dropoffLocation, 2, 300) && booking.pickupLocation.toLowerCase() !== booking.dropoffLocation.toLowerCase() && date(booking.dateTime) && date(booking.timestamp) && Date.parse(booking.dateTime) > Date.parse(booking.timestamp) && Date.parse(booking.dateTime) <= Date.parse(booking.timestamp) + 366 * 86400000 && integer(booking.passengers, 1, 6) && booking.typeOfService === booking.serviceType && integer(booking.driverId, 1, 1000000) && string(booking.driverName) && string(booking.vehicleNumber, 1, 40) && number(booking.price, 0.01, 100000) && Math.abs(booking.price * 100 - Math.round(booking.price * 100)) < 0.000001 && string(booking.specialRequests, 0, 2000) && ['confirmed','cancelled','completed'].includes(booking.status), 'booking record');
    const service = db.rideServices.find(service => service.name === booking.serviceType);
    ensure(service && booking.passengers <= service.capacity, 'booking capacity or service');
    ensure(db.users.some(user => user.id === booking.userId), 'booking owner reference');
    ensure(db.drivers.some(driver => driver.id === booking.driverId && driver.serviceType === booking.serviceType), 'booking driver reference');
    ensure(booking.requestFingerprint === bookingFingerprint(booking), 'booking request fingerprint');
  }
  for (const [name, rows] of Object.entries(db)) unique(rows, 'id', `${name} duplicate IDs`);
  unique(db.users, 'email', 'duplicate user emails'); unique(db.rideServices, 'name', 'duplicate service names');
  unique(db.drivers.map(driver => ({ plate: driver.vehicleNumber.toLowerCase() })), 'plate', 'duplicate vehicle registrations');
  unique(db.bookings.map(booking => ({ key: `${booking.userId}:${booking.requestId}` })), 'key', 'duplicate booking request keys');
}
module.exports = { validateDatabase, bookingFingerprint };
