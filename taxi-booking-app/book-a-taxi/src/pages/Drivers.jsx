import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api';
import './Pages.css';

// Driver selection page that finalizes a user's choice before confirmation.
function Drivers() {
  const navigate = useNavigate();
  const [bookingData] = useState(() => {
    const data = sessionStorage.getItem('bookingData');
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing booking data:', error);
      sessionStorage.removeItem('bookingData');
      return null;
    }
  });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [displayedDrivers, setDisplayedDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Randomize and map backend driver records into UI display cards.
  const getRandomDrivers = (drivers) => {
    const shuffled = [...drivers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).map((driver, index) => ({
      id: driver.id,
      name: driver.name,
      rating: driver.rating,
      reviews: Math.floor(Math.random() * 300) + 50,
      vehicleType: 'Premium Taxi',
      vehicleNumber: driver.plate,
      price: `$${(Math.random() * 15 + 20).toFixed(2)}`,
      estimatedTime: `${Math.floor(Math.random() * 10) + 2} mins away`,
      avatar: index % 2 === 0 ? '👨‍💼' : '👩‍💼',
    }));
  };

  // Load drivers from backend when the page mounts.
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(apiUrl('/drivers'));
        if (response.ok) {
          const drivers = await response.json();
          const randomDrivers = getRandomDrivers(drivers);
          setDisplayedDrivers(randomDrivers);
        } else {
          setError('Failed to load drivers');
        }
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError('Could not connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleSelectDriver = (driver) => {
    // Store currently selected driver ID.
    setSelectedDriver(driver.id);
  };

  const handleConfirmBooking = () => {
    // Persist selected driver with booking draft and navigate to confirmation page.
    if (!selectedDriver) {
      alert('Please select a driver');
      return;
    }

    // Double-check authentication (safety measure)
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const selectedDriverData = displayedDrivers.find((d) => d.id === selectedDriver);
    const completeBooking = {
      ...bookingData,
      selectedDriver: selectedDriverData,
    };

    sessionStorage.setItem('completeBooking', JSON.stringify(completeBooking));
    navigate('/confirmation', { state: { bookingData: completeBooking } });
  };

  const handleBackHome = () => {
    // Return to booking form.
    navigate('/home');
  };

  if (!bookingData) {
    return (
      <div className="container no-booking-container">
        <div className="no-booking-message">
          <div className="no-booking-icon">📋</div>
          <h2>No Booking Information</h2>
          <p>It looks like you haven't started a booking yet. Please fill out the booking form to see available drivers.</p>
          <button onClick={handleBackHome} className="btn btn-primary">
            ← Back to Booking Form
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading available drivers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container drivers-container">
        <div className="drivers-header">
          <h1 className="heading">Available Drivers</h1>
          <p className="subheading">Select a driver for your journey</p>
        </div>
        <div className="auth-error" style={{ marginTop: '20px' }}>
          ⚠️ {error}
        </div>
        <div className="booking-actions">
          <button onClick={handleBackHome} className="btn btn-secondary">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container drivers-container">
      <div className="drivers-header">
        <h1 className="heading">Available Drivers</h1>
        <p className="subheading">Select a driver for your journey (randomly selected from 52 drivers)</p>
      </div>

      <div className="booking-summary">
        <div className="summary-item">
          <div className="summary-item-label">From</div>
          <div className="summary-item-value">{bookingData.pickupLocation}</div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">To</div>
          <div className="summary-item-value">{bookingData.dropoffLocation}</div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Date & Time</div>
          <div className="summary-item-value">
            {new Date(bookingData.pickupDate).toLocaleDateString()} {bookingData.pickupTime}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-item-label">Passengers</div>
          <div className="summary-item-value">{bookingData.passengerCount}</div>
        </div>
      </div>

      <div className="drivers-list">
        {displayedDrivers.map((driver) => (
          <div
            key={driver.id}
            className={`driver-card ${selectedDriver === driver.id ? 'selected' : ''}`}
            onClick={() => handleSelectDriver(driver)}
          >
            <div className="driver-avatar">{driver.avatar}</div>
            <div className="driver-info">
              <h3>{driver.name}</h3>
              <div className="driver-details">
                <span className="rating">
                  ⭐ {driver.rating} ({driver.reviews})
                </span>
                <span>{driver.vehicleNumber}</span>
              </div>
              <span className="vehicle-type">{driver.vehicleType}</span>
            </div>
            <div className="driver-price">
              <div className="price-amount">{driver.price}</div>
              <div className="estimated-time">{driver.estimatedTime}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="booking-actions">
        <button onClick={handleBackHome} className="btn btn-secondary">
          ← Back
        </button>
        <button onClick={handleConfirmBooking} className="btn btn-primary">
          Confirm Selection →
        </button>
      </div>
    </div>
  );
}

export default Drivers;
