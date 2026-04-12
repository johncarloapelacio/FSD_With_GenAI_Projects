import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pages.css';

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

  // Mock driver data
  const mockDrivers = [
    {
      id: 1,
      name: 'John Smith',
      rating: 4.8,
      reviews: 234,
      vehicleType: 'Sedan',
      vehicleNumber: 'ABC 123',
      price: '$25.00',
      estimatedTime: '5 mins away',
      avatar: '👨‍💼',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      rating: 4.9,
      reviews: 189,
      vehicleType: 'SUV',
      vehicleNumber: 'XYZ 789',
      price: '$32.00',
      estimatedTime: '8 mins away',
      avatar: '👩‍💼',
    },
    {
      id: 3,
      name: 'Mike Davis',
      rating: 4.7,
      reviews: 312,
      vehicleType: 'Sedan',
      vehicleNumber: 'DEF 456',
      price: '$24.00',
      estimatedTime: '3 mins away',
      avatar: '👨‍💼',
    },
    {
      id: 4,
      name: 'Emma Wilson',
      rating: 4.6,
      reviews: 156,
      vehicleType: 'Comfort',
      vehicleNumber: 'GHI 789',
      price: '$28.00',
      estimatedTime: '12 mins away',
      avatar: '👩‍💼',
    },
  ];

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver.id);
  };

  const handleConfirmBooking = () => {
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

    const selectedDriverData = mockDrivers.find((d) => d.id === selectedDriver);
    const completeBooking = {
      ...bookingData,
      selectedDriver: selectedDriverData,
    };

    sessionStorage.setItem('completeBooking', JSON.stringify(completeBooking));
    navigate('/confirmation', { state: { bookingData: completeBooking } });
  };

  const handleBackHome = () => {
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

  return (
    <div className="container drivers-container">
      <div className="drivers-header">
        <h1 className="heading">Available Drivers</h1>
        <p className="subheading">Select a driver for your journey</p>
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
        {mockDrivers.map((driver) => (
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
