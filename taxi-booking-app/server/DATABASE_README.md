# Book a Taxi - Server Database Setup Guide

## Overview
The database.json file contains all the pricing, driver, and booking information for the Book a Taxi application. This file is stored in the server directory and serves as the central data repository.

## Database Location
```
C:\Users\johnc\OneDrive\Desktop\FSD_With_GenAI_Projects\taxi-booking-app\server\database.json
```

## Database Structure

### 1. Ride Services
Defines all available ride service types with pricing:

```json
{
  "id": 1,
  "name": "Economy",
  "description": "Budget-friendly rides for everyday commute",
  "basePrice": 5.00,           // Starting price per ride
  "pricePerMile": 1.50,        // Price multiplier per mile of distance
  "pricePerMinute": 0.30,      // Price for waiting time
  "icon": "🚗",
  "capacity": 4,               // Maximum passengers
  "features": [...]            // Special features of this service
}
```

**Available Services:**
- **Economy**: Base $5.00, $1.50/mile, $0.30/min
- **Comfort**: Base $8.00, $2.00/mile, $0.40/min
- **Premium**: Base $15.00, $3.50/mile, $0.65/min
- **XL**: Base $12.00, $2.80/mile, $0.50/min

### 2. Drivers
Contains information about available drivers:

```json
{
  "id": 1,
  "name": "John Smith",
  "rating": 4.8,              // Customer rating (0-5)
  "reviews": 234,             // Number of customer reviews
  "vehicleType": "Sedan",
  "vehicleNumber": "ABC 123",
  "serviceType": "Economy",   // Associated service level
  "estimatedTime": "5 mins away",
  "avatar": "👨‍💼",
  "phone": "+1-555-0101",
  "email": "john.smith@bookataxe.com",
  "yearsExperience": 5
}
```

**Sample Drivers:**
- John Smith (4.8★) - Sedan
- Sarah Johnson (4.9★) - SUV
- Mike Davis (4.7★) - Sedan
- Emma Wilson (4.6★) - Comfort Vehicle

### 3. Bookings
Array to store completed and pending bookings:
```json
{
  "bookings": [
    {
      "id": "BOOKING_ID",
      "userId": "USER_ID",
      "driverId": 1,
      "serviceType": "Economy",
      "pickupLocation": "123 Main St",
      "dropoffLocation": "456 Oak Ave",
      "pickupDate": "2026-04-15",
      "pickupTime": "10:30",
      "passengers": 2,
      "totalFare": 25.50,
      "status": "completed",
      "timestamp": "2026-04-11T15:30:00Z"
    }
  ]
}
```

### 4. Users
Array to store user account information:
```json
{
  "users": [
    {
      "id": "USER_ID",
      "name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+1-555-1234",
      "memberSince": "2026-01-15",
      "totalRides": 5,
      "averageRating": 4.5,
      "paymentMethods": [],
      "preferences": {}
    }
  ]
}
```

## Integration with Frontend

### Accessing Price Information
To display pricing in the Services page:

```javascript
// Read from database.json
const services = databaseJson.rideServices;

services.map(service => (
  <div key={service.id}>
    <h3>{service.name}</h3>
    <p>Base: ${service.basePrice}</p>
    <p>Per Mile: ${service.pricePerMile}</p>
    <p>Per Minute: ${service.pricePerMinute}</p>
  </div>
))
```

### Accessing Driver Information
For the Drivers page:

```javascript
const drivers = databaseJson.drivers;

drivers.map(driver => (
  <DriverCard
    name={driver.name}
    rating={driver.rating}
    vehicleType={driver.vehicleType}
    price={calculatePrice(driver.serviceType)}
  />
))
```

## Pricing Calculation Formula

To calculate the estimated fare for a ride:

```javascript
function calculateRideFare(serviceType, distanceMiles, durationMinutes) {
  const service = rideServices.find(s => s.name === serviceType);
  
  const distanceCost = service.basePrice + (distanceMiles * service.pricePerMile);
  const timeCost = durationMinutes * service.pricePerMinute;
  
  const subtotal = distanceCost + timeCost;
  const serviceFee = subtotal * 0.15; // 15% service fee
  const tax = (subtotal + serviceFee) * 0.08; // 8% tax
  
  const totalFare = subtotal + serviceFee + tax;
  
  return {
    subtotal: subtotal.toFixed(2),
    serviceFee: serviceFee.toFixed(2),
    tax: tax.toFixed(2),
    total: totalFare.toFixed(2)
  };
}
```

## Adding New Data

### Adding a New Driver
To add a new driver to the database:

```json
{
  "id": 5,
  "name": "David Brown",
  "rating": 4.7,
  "reviews": 198,
  "vehicleType": "SUV",
  "vehicleNumber": "JKL 012",
  "serviceType": "Comfort",
  "estimatedTime": "10 mins away",
  "avatar": "👨‍💼",
  "phone": "+1-555-0105",
  "email": "david.brown@bookataxe.com",
  "yearsExperience": 8
}
```

### Recording a Booking
When a user completes a booking, add it to the bookings array:

```javascript
const newBooking = {
  id: generateUniqueId(),
  userId: currentUser.id,
  driverId: selectedDriverId,
  serviceType: selectedService.name,
  pickupLocation: formData.pickupLocation,
  dropoffLocation: formData.dropoffLocation,
  pickupDate: formData.pickupDate,
  pickupTime: formData.pickupTime,
  passengers: parseInt(formData.passengerCount),
  totalFare: calculatedFare,
  status: "pending",
  timestamp: new Date().toISOString()
};

// Add to database
database.bookings.push(newBooking);
```

## Backend Integration (Future)

### API Endpoints to Implement

```
GET /api/services          - Get all ride services
GET /api/drivers           - Get available drivers
GET /api/drivers/:id       - Get specific driver
POST /api/bookings         - Create new booking
GET /api/bookings/:id      - Get booking details
GET /api/users/:id         - Get user profile
POST /api/users            - Create new user
PUT /api/bookings/:id      - Update booking status
```

## Using with Express.js (Recommended)

Example setup:

```javascript
const express = require('express');
const fs = require('fs');
const app = express();

// Load database
const database = JSON.parse(fs.readFileSync('./database.json', 'utf8'));

// API Routes
app.get('/api/services', (req, res) => {
  res.json(database.rideServices);
});

app.get('/api/drivers', (req, res) => {
  res.json(database.drivers);
});

app.post('/api/bookings', (req, res) => {
  const newBooking = req.body;
  database.bookings.push(newBooking);
  
  // Save to file
  fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
  
  res.json({ success: true, bookingId: newBooking.id });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

## Data Persistence

### Current Implementation
- Data is stored in a JSON file (simple but limited)
- Suitable for development and small-scale applications
- No real-time synchronization

### Recommended Future Improvements
1. **MongoDB**: For scalable database
2. **Firebase**: For real-time updates
3. **PostgreSQL**: For complex relational data
4. **Redis**: For caching and sessions

## Security Considerations

1. **Never expose sensitive data** in the frontend
2. **Validate all input** on both client and server
3. **Use environment variables** for API keys
4. **Implement authentication** (JWT tokens)
5. **Encrypt passwords** using bcrypt
6. **Use HTTPS** for all API communications
7. **Implement rate limiting** to prevent abuse

## Maintenance

### Regular Tasks
- Monitor database file size
- Backup data regularly
- Archive old bookings
- Update driver information
- Review and update pricing

### Data Cleanup
```javascript
// Remove bookings older than 1 year
function cleanupOldBookings() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  database.bookings = database.bookings.filter(booking => {
    return new Date(booking.timestamp) > oneYearAgo;
  });
  
  fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
}
```

---

**Last Updated**: April 11, 2026
**Database Version**: 1.0.0
