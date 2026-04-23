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
      sessionStorage.removeItem('pendingBookingDraft');
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

  const [bookingData, setBookingData] = useState(() => ({
    pickupLocation: initialDraft.bookingData?.pickupLocation || '',
    dropoffLocation: initialDraft.bookingData?.dropoffLocation || '',
    pickupDate: initialDraft.bookingData?.pickupDate || '',
    pickupTime: initialDraft.bookingData?.pickupTime || '',
    serviceType: location.state?.selectedService || initialDraft.bookingData?.serviceType || 'Economy',
    passengerCount: initialDraft.bookingData?.passengerCount || '1',
    specialRequests: initialDraft.bookingData?.specialRequests || '',
  }));

  // Display values for flexible input fields
  const [displayValues, setDisplayValues] = useState(() => ({
    pickupDate: initialDraft.displayValues?.pickupDate || '',
    pickupTime: initialDraft.displayValues?.pickupTime || '',
  }));

  const [errors, setErrors] = useState({});
  const isLoggedIn = !!localStorage.getItem('user');

  // Parse flexible date formats and convert to YYYY-MM-DD
  const parseDate = (dateString) => {
    if (!dateString.trim()) return '';

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    // Remove extra spaces and convert to lowercase for easier parsing
    const cleanInput = dateString.trim().toLowerCase();

    // Try different date formats
    const datePatterns = [
      // MM/DD/YYYY or MM/DD/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
      // MM-DD-YYYY or MM-DD-YY
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
      // YYYY/MM/DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      // YYYY-MM-DD (already standard)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD/MM/YYYY or DD/MM/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
      // DD-MM-YYYY or DD-MM-YY
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
    ];

    for (const pattern of datePatterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        let year, month, day;

        if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
          // MM/DD/YYYY or MM-DD-YYYY format
          [, month, day, year] = match;
        } else if (pattern === datePatterns[2] || pattern === datePatterns[3]) {
          // YYYY/MM/DD or YYYY-MM-DD format
          [, year, month, day] = match;
        } else if (pattern === datePatterns[4] || pattern === datePatterns[5]) {
          // DD/MM/YYYY or DD-MM-YYYY format (assuming European format)
          [, day, month, year] = match;
        }

        // Convert 2-digit year to 4-digit
        year = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : parseInt(year);
        month = parseInt(month) - 1; // JS months are 0-based
        day = parseInt(day);

        // Validate the date
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    }

    // Try relative dates
    if (cleanInput === 'today' || cleanInput === 'now') {
      return `${currentYear.toString().padStart(4, '0')}-${(currentMonth + 1).toString().padStart(2, '0')}-${currentDate.toString().padStart(2, '0')}`;
    }

    if (cleanInput === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(currentDate + 1);
      return `${tomorrow.getFullYear().toString().padStart(4, '0')}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
    }

    // Try day names
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(cleanInput);
    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
      targetDate.setDate(currentDate + daysToAdd);
      return `${targetDate.getFullYear().toString().padStart(4, '0')}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;
    }

    return ''; // Invalid date
  };

  // Parse flexible time formats and convert to HH:MM
  const parseTime = (timeString) => {
    if (!timeString.trim()) return '';

    const cleanInput = timeString.trim().toLowerCase().replace(/\s+/g, '');

    // Try different time formats
    const timePatterns = [
      // HH:MM (already standard)
      /^(\d{1,2}):(\d{2})$/,
      // HH:MM AM/PM
      /^(\d{1,2}):(\d{2})(am|pm)$/,
      // HHMM
      /^(\d{1,2})(\d{2})$/,
      // HH AM/PM or H AM/PM
      /^(\d{1,2})(am|pm)$/,
      // HH.MM
      /^(\d{1,2})\.(\d{2})$/,
    ];

    for (const pattern of timePatterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        let hours, minutes, period = '';

        if (pattern === timePatterns[0]) {
          // HH:MM
          [, hours, minutes] = match;
        } else if (pattern === timePatterns[1]) {
          // HH:MM AM/PM
          [, hours, minutes, period] = match;
        } else if (pattern === timePatterns[2]) {
          // HHMM
          [, hours, minutes] = match;
        } else if (pattern === timePatterns[3]) {
          // HH AM/PM
          [, hours, period] = match;
          minutes = '00';
        } else if (pattern === timePatterns[4]) {
          // HH.MM
          [, hours, minutes] = match;
        }

        hours = parseInt(hours);
        minutes = parseInt(minutes || 0);

        // Handle AM/PM
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }

        // Validate time
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    // Try common time words
    const timeWords = {
      'noon': '12:00',
      'midnight': '00:00',
      'morning': '09:00',
      'afternoon': '14:00',
      'evening': '18:00',
      'night': '20:00',
    };

    if (timeWords[cleanInput]) {
      return timeWords[cleanInput];
    }

    return ''; // Invalid time
  };

  // Format date for display (MM/DD/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const formatTimeForDisplay = (timeString) => {
    // Convert 24-hour HH:MM values into user-friendly 12-hour text.
    if (!timeString) return '';

    const [hoursString, minutesString] = timeString.split(':');
    let hours = parseInt(hoursString, 10);
    const minutes = minutesString || '00';
    const period = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${minutes} ${period}`;
  };

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

      // Update display to formatted version if parsing was successful
      if (parsedDate) {
        setTimeout(() => {
          setDisplayValues(prev => ({
            ...prev,
            pickupDate: formatDateForDisplay(parsedDate),
          }));
        }, 100);
      }
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

      // Update display to formatted version if parsing was successful
      if (parsedTime) {
        setTimeout(() => {
          setDisplayValues(prev => ({
            ...prev,
            pickupTime: formatTimeForDisplay(parsedTime),
          }));
        }, 100);
      }
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
      const selectedDate = new Date(bookingData.pickupDate);
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

    // If user is not logged in, redirect immediately before validating booking fields.
    const storedUser = localStorage.getItem('user');
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
              placeholder="e.g., 12/25/2024, tomorrow, Monday, 25-Dec-2024"
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
              <option value="5">5+ Passengers</option>
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
