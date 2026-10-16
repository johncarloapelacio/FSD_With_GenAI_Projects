import { parseDate, parseTime } from '../bookingInput';
import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Pages.css';

// Primary booking form page with flexible date/time parsing and draft restore.
function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  // Restore a pending draft after auth redirects so users do not lose form input.
  const initialDraft = useMemo(() => {
    const draft = sessionStorage.getItem('pendingBookingDraft');
    if (!draft) {
      return { bookingData: null, displayValues: null };
    }

    try {
      const parsedDraft = JSON.parse(draft);
      return {
        bookingData: parsedDraft.bookingData || null,
        displayValues: parsedDraft.displayValues || null,
      };
    } catch (error) {
      console.error('Error restoring booking draft:', error);
      sessionStorage.removeItem('pendingBookingDraft');
      return { bookingData: null, displayValues: null };
    }
  }, []);

  const restored = location.state?.bookingData || initialDraft.bookingData;
  const [bookingData, setBookingData] = useState(() => ({
    pickupLocation: restored?.pickupLocation || '',
    dropoffLocation: restored?.dropoffLocation || '',
    pickupDate: restored?.pickupDate || '',
    pickupTime: restored?.pickupTime || '',
    serviceType: location.state?.selectedService || restored?.serviceType || 'Economy',
    passengerCount: restored?.passengerCount || '1',
    specialRequests: restored?.specialRequests || '',
  }));

  // Display values for flexible input fields
  const [displayValues, setDisplayValues] = useState(() => ({
    pickupDate: initialDraft.displayValues?.pickupDate || restored?.pickupDate || '',
    pickupTime: initialDraft.displayValues?.pickupTime || restored?.pickupTime || '',
  }));

  const [errors, setErrors] = useState({});
  const [pendingConfirmation] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('completeBooking'));
      const current = JSON.parse(sessionStorage.getItem('user'));
      if (saved?.submissionOwnerId && current?.id && saved.submissionOwnerId !== current.id) { sessionStorage.removeItem('completeBooking'); return null; }
      return saved?.submissionAttempted ? saved : null;
    }
    catch { return null; }
  });
  const isLoggedIn = !!sessionStorage.getItem('user');

  const handleChange = (e) => {
    // Update form state and normalize free-form date/time input.
    const { name, value } = e.target;

    if (name === 'pickupDate') {
      // Update display value immediately
      setDisplayValues(prev => ({
        ...prev,
        pickupDate: value,
      }));

      // Parse and store the actual date value
      const parsedDate = parseDate(value);
      setBookingData((prev) => ({
        ...prev,
        pickupDate: parsedDate,
      }));


    } else if (name === 'pickupTime') {
      // Update display value immediately
      setDisplayValues(prev => ({
        ...prev,
        pickupTime: value,
      }));

      // Parse and store the actual time value
      const parsedTime = parseTime(value);
      setBookingData((prev) => ({
        ...prev,
        pickupTime: parsedTime,
      }));


    } else {
      setBookingData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    // Validate booking fields before moving to driver selection.
    const newErrors = {};

    if (!bookingData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required';
    } else if (bookingData.pickupLocation.trim().length < 2) {
      newErrors.pickupLocation = 'Pickup location must be at least 2 characters';
    }

    if (!bookingData.dropoffLocation.trim()) {
      newErrors.dropoffLocation = 'Dropoff location is required';
    } else if (bookingData.dropoffLocation.trim().length < 2) {
      newErrors.dropoffLocation = 'Dropoff location must be at least 2 characters';
    }

    if (bookingData.pickupLocation && bookingData.dropoffLocation && 
        bookingData.pickupLocation.toLowerCase() === bookingData.dropoffLocation.toLowerCase()) {
      newErrors.dropoffLocation = 'Dropoff location must be different from pickup location';
    }

    if (!bookingData.pickupDate) {
      newErrors.pickupDate = 'Pickup date is required';
    } else {
      const selectedDate = new Date(`${bookingData.pickupDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.pickupDate = 'Pickup date cannot be in the past';
      }
    }

    if (!bookingData.pickupTime) {
      newErrors.pickupTime = 'Pickup time is required';
    } else {
      if (bookingData.pickupTime.length !== 5 || !bookingData.pickupTime.includes(':')) {
        newErrors.pickupTime = 'Please enter a valid time';
      }
    }

    if (bookingData.pickupDate && bookingData.pickupTime && new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`) <= new Date()) { newErrors.pickupTime = 'Pickup must be in the future'; }
    const capacity = { Economy: 4, Comfort: 5, Premium: 4, XL: 6 }[bookingData.serviceType];
    if (Number(bookingData.passengerCount) > capacity) newErrors.passengerCount = `This service supports up to ${capacity} passengers`;
    if (!bookingData.passengerCount) {
      newErrors.passengerCount = 'Number of passengers is required';
    }

    if (!bookingData.serviceType) {
      newErrors.serviceType = 'Please select a service type';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    // Redirect unauthenticated users to login and preserve draft; otherwise continue flow.
    e.preventDefault();
    if (pendingConfirmation) { navigate("/confirmation", { state: { bookingData: pendingConfirmation } }); return; }

    // If user is not logged in, redirect immediately before validating booking fields.
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      sessionStorage.setItem('pendingBookingDraft', JSON.stringify({
        bookingData,
        displayValues,
      }));
      navigate('/login');
      return;
    }

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // User is logged in, proceed with booking
    // Store booking data in session/local storage for next page
    sessionStorage.removeItem('pendingBookingDraft');
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    navigate('/drivers');
  };

  return (
    <div className="container">
      <h1 className="heading">Book Your Taxi Now</h1>
      <p className="subheading">Quick, reliable, and affordable rides at your fingertips</p>

      {pendingConfirmation && <div role="status" className="auth-error">
        A previous confirmation needs a result. <button type="button" className="btn btn-secondary" onClick={() => navigate('/confirmation', { state: { bookingData: pendingConfirmation } })}>Resume Booking Confirmation</button>
      </div>}
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pickup">Pickup Location *</label>
            <input
              type="text"
              id="pickup"
              name="pickupLocation"
              placeholder="Enter pickup address"
              value={bookingData.pickupLocation}
              onChange={handleChange}
              className={errors.pickupLocation ? 'input-error' : ''}
            />
            {errors.pickupLocation && <span className="error-message">{errors.pickupLocation}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="dropoff">Dropoff Location *</label>
            <input
              type="text"
              id="dropoff"
              name="dropoffLocation"
              placeholder="Enter dropoff address"
              value={bookingData.dropoffLocation}
              onChange={handleChange}
              className={errors.dropoffLocation ? 'input-error' : ''}
            />
            {errors.dropoffLocation && <span className="error-message">{errors.dropoffLocation}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Pickup Date *</label>
            <input
              type="text"
              id="date"
              name="pickupDate"
              placeholder="MM/DD/YYYY, YYYY-MM-DD, tomorrow, Monday"
              value={displayValues.pickupDate}
              onChange={handleChange}
              className={errors.pickupDate ? 'input-error' : ''}
            />
            {errors.pickupDate && <span className="error-message">{errors.pickupDate}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="time">Pickup Time *</label>
            <input
              type="text"
              id="time"
              name="pickupTime"
              placeholder="e.g., 2:30 PM, 14:30, 3pm, noon, 15.45"
              value={displayValues.pickupTime}
              onChange={handleChange}
              className={errors.pickupTime ? 'input-error' : ''}
            />
            {errors.pickupTime && <span className="error-message">{errors.pickupTime}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="serviceType">Service Type *</label>
            <select
              id="serviceType"
              name="serviceType"
              value={bookingData.serviceType}
              onChange={handleChange}
              className={errors.serviceType ? 'input-error' : ''}
            >
              <option value="Economy">Economy</option>
              <option value="Comfort">Comfort</option>
              <option value="Premium">Premium</option>
              <option value="XL">XL</option>
            </select>
            {errors.serviceType && <span className="error-message">{errors.serviceType}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="passengers">Number of Passengers *</label>
            <select
              id="passengers"
              name="passengerCount"
              value={bookingData.passengerCount}
              onChange={handleChange}
              className={errors.passengerCount ? 'input-error' : ''}
            >
              <option value="1">1 Passenger</option>
              <option value="2">2 Passengers</option>
              <option value="3">3 Passengers</option>
              <option value="4">4 Passengers</option>
              <option value="5">5 Passengers</option>
              <option value="6">6 Passengers</option>
            </select>
            {errors.passengerCount && <span className="error-message">{errors.passengerCount}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="special">Special Requests (Optional)</label>
          <textarea
            id="special"
            name="specialRequests"
            placeholder="Any special requests? E.g., extra luggage space, quiet ride, etc."
            value={bookingData.specialRequests}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {isLoggedIn ? 'Book Your Ride →' : 'Login to Book →'}
        </button>
      </form>

      <div className="features-section">
        <h2 className="features-title">Why Choose Book a Taxi?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Quick Booking</h3>
            <p>Book a ride in seconds with our simple interface</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👨‍💼</span>
            <h3>Professional Drivers</h3>
            <p>Verified and experienced drivers for your safety</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>Affordable Rates</h3>
            <p>Transparent pricing with no hidden charges</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <h3>Safe & Secure</h3>
            <p>Your safety is our top priority</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
