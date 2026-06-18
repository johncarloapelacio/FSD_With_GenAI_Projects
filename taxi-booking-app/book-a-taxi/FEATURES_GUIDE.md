# 📚 Application Features & User Guide

## 🏠 Home Page (`/`)

### Features
- **Taxi Booking Form** - Primary booking interface
- **Quick Features Section** - Shows 4 main benefits
- **Responsive Design** - Works on all devices

### Form Fields
1. **Pickup Location** *(Required)*
   - Minimum 2 characters
   - Must be different from dropoff location

2. **Dropoff Location** *(Required)*
   - Minimum 2 characters
   - Must be different from pickup location

3. **Pickup Date** *(Required)*
   - Cannot select past dates
   - Date picker interface

4. **Pickup Time** *(Required)*
   - Time in HH:MM format
   - Validation for valid time

5. **Number of Passengers** *(Required)*
   - Options: 1, 2, 3, 4, 5+ passengers
   - Auto-selected: 1

6. **Special Requests** *(Optional)*
   - Free text field
   - Examples: extra luggage, quiet ride, etc.

### Why Choose Book a Taxi Section
- ⚡ Quick Booking
- 👨‍💼 Professional Drivers
- 💰 Affordable Rates
- 🛡️ Safe & Secure

---

## 🚙 Drivers Page (`/drivers`)

### Features
- **Booking Summary** - Shows your trip details
- **Available Drivers** - List of drivers for selection
- **Driver Ratings** - Based on customer reviews
- **Pricing Display** - Per-ride pricing

### Driver Information Displayed
- Driver name
- Average rating (★ out of 5)
- Number of reviews
- Vehicle type
- Vehicle registration number
- Estimated arrival time
- Base fare price

### Actions
- **Select Driver** - Click on any driver card to select
- **Back** - Return to booking (loses data)
- **Confirm Selection** - Proceed to confirmation page

---

## ✅ Confirmation Page (`/confirmation`)

### Features
- **Success Confirmation** - Visual confirmation icon
- **Booking Details** - Complete trip information
- **What Happens Next** - 4-step process explanation
- **Next Steps Section** - Driver notification, tracking, payment

### Displayed Information
- Booking ID (randomly generated)
- Pickup location
- Dropoff location
- Pickup date and time
- Number of passengers
- Vehicle type
- Driver name
- Estimated fare
- Special requests (if any)

### Actions
- **View Full Details** - Show complete booking JSON
- **Book Another Ride** - Clear session and return to home

---

## 🏢 About Page (`/about`)

### Sections
1. **Our Story** - Company history and mission
2. **Our Mission** - Core purpose statement
3. **Our Values** - 4 value cards with icons
   - 🚀 Innovation
   - 🛡️ Safety
   - 💚 Community
   - ✨ Excellence

4. **Why Choose Book a Taxi** - 8 key benefits list
5. **Our Team** - Team introduction
6. **By The Numbers** - 4 statistics
   - 50K+ Happy Customers
   - 2000+ Active Drivers
   - 500K+ Completed Rides
   - 4.8★ Average Rating

---

## 🎯 Services Page (`/services`)

### Ride Service Tiers

**1. Economy** 🚗
- Base Price: $5.00
- Per Mile: $1.50
- Per Minute: $0.30
- Capacity: 4 passengers
- Features: Affordable pricing, GPS tracking, Professional drivers

**2. Comfort** 🚙
- Base Price: $8.00
- Per Mile: $2.00
- Per Minute: $0.40
- Capacity: 5 passengers
- Features: Spacious, Climate control, Premium audio, Phone charger

**3. Premium** 🚘
- Base Price: $15.00
- Per Mile: $3.50
- Per Minute: $0.65
- Capacity: 4 passengers
- Features: Luxury vehicle, Premium seating, WiFi, Bottled water, Professional attire

**4. XL** 🚐
- Base Price: $12.00
- Per Mile: $2.80
- Per Minute: $0.50
- Capacity: 6 passengers
- Features: 6-seater, Extra luggage space, Climate control, GPS

### Additional Sections

**Additional Services Available**
- 🎁 Special Occasions
- 👥 Corporate Rides
- ✈️ Airport Transfers
- 📦 Scheduled Rides

**How Our Pricing Works**
- Explains base fare
- Distance charges
- Time charges
- Surge pricing during peak hours

---

## 📞 Contact Page (`/contact`)

### Contact Information
- 📍 **Address**: 123 Transportation Ave, New York, NY 10001
- 📞 **Phone**: +1 (555) 123-4567 (24/7)
- ✉️ **Email**: support@bookataxe.com, info@bookataxe.com
- ⏰ **Hours**: 24 Hours a Day, 7 Days a Week

### Contact Form Fields

1. **Full Name** *(Required)*
   - Validation: Non-empty

2. **Email Address** *(Required)*
   - Validation: Valid email format (example@domain.com)

3. **Phone Number** *(Required)*
   - Validation: Valid international format (+1-555-123-4567)
   - Accepts 10+ digits

4. **Subject** *(Required)*
   - Validation: Non-empty

5. **Message** *(Required)*
   - Validation: Minimum 10 characters
   - Textarea with 5-row height

### Form Features
- ✅ Success message on submission
- ❌ Error messages for validation failures
- 🔄 Auto-clear errors as user types
- 📤 Submit button with loading state

### Social Media Links
- 📘 Facebook
- 🐦 Twitter
- 📷 Instagram
- 💼 LinkedIn

### FAQ Section (4 Questions)
- How do I book a ride?
- What payment methods do you accept?
- Can I cancel my booking?
- Are your drivers verified?

---

## 🎨 Design Theme

### Color Palette
- **White** (#FFFFFF) - Main background
- **Black** (#000000) - Primary text
- **Light Gray** (#EEEEEE) - Secondary background
- **Dark Burgundy** (#660022) - Primary accent
- **Dark Navy Blue** (#001F3F) - Secondary accent

### Design Features
- Gradient backgrounds (Burgundy → Navy Blue)  
- Smooth hover effects with lift animation
- Visual error states with red highlighting
- Success states with green checkmarks
- Box shadows for depth
- Responsive grid layouts
- Mobile-first design approach

---

## 🔐 Form Validation

### Real-Time Validation
- ✓ Errors appear as user types
- ✓ Errors clear when fixed
- ✓ Visual feedback with red borders
- ✓ Clear error messages

### Validation Rules

**Home Page**
- Pickup location: 2+ characters
- Dropoff: 2+ characters, different from pickup
- Date: Today or future only
- Time: Valid HH:MM format
- Passengers: 1-5+

**Contact Page**
- Name: Non-empty
- Email: RFC-compliant format
- Phone: 10+ digits
- Subject: Non-empty
- Message: 10+ characters

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+ (Full layout)
- **Tablet**: 768px - 1199px (Adjusted grid)
- **Mobile**: < 768px (Stacked layout)

### Mobile Features
- Collapsed navigation
- Single-column layouts
- Touch-friendly buttons
- Readable text sizes
- Optimized spacing

---

## ⌨️ Keyboard Navigation

- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **Shift+Tab**: Navigate backwards
- **Escape**: Close modals (future feature)

---

## ♿ Accessibility Features

- Semantic HTML structure
- ARIA labels for screen readers
- Color contrast compliance
- Form labels associated with inputs
- Error messages linked to fields
- Keyboard navigable forms

---

## 🚀 Quick Start Guide

1. **Visit Home Page**
   - Enter pickup and dropoff locations
   - Select date and time
   - Choose number of passengers
   - Click "Find Drivers"

2. **Select Driver**
   - Review available drivers
   - Check ratings and reviews
   - Compare prices
   - Click on driver card to select
   - Click "Confirm Selection"

3. **Confirm Booking**
   - Review all booking details
   - Note your booking ID
   - Follow "What Happens Next" steps
   - Book another ride or exit

---

## 📊 Pricing Example

**Scenario**: Economy ride, 5 miles, 15 minutes

Calculation:
- Base Fare: $5.00
- Distance (5 miles × $1.50): $7.50
- Time (15 min × $0.30): $4.50
- Subtotal: $17.00

Estimate shows: **~$17.00**
*(Actual fare may vary with surge pricing)*

---

## 🆘 Troubleshooting

### Form Validation Errors

**"Pickup location is required"**
- Enter a location name (minimum 2 characters)

**"Dropoff location must be different"**
- Enter a different address from pickup

**"Pickup date cannot be in the past"**
- Select today or a future date

**"Please enter a valid email"**
- Use format: example@domain.com

**"Phone number must be at least 10 digits"**
- Include area code and full number

### General Issues

**Page not loading:**
- Check internet connection
- Clear browser cache
- Try refreshing the page

**Form data lost:**
- Data is stored only during current session
- New browser session = fresh start

---

## 📞 Customer Support

For technical issues or questions:
- **Email**: support@bookataxe.com
- **Phone**: +1 (555) 123-4567
- **Hours**: 24/7 Support

---

**Last Updated**: April 11, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
