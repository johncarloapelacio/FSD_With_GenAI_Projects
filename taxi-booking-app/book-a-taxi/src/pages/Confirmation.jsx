import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiUrl } from '../api';
import './Pages.css';

// Booking confirmation page that submits selected ride details to backend.
function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Restore authenticated user and booking payload from navigation/session state.
    // Check if user is authenticated (but don't redirect)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Don't redirect, just set user to null
      }
    }

    // Get booking data from location state first, then fallback to session storage.
    if (location.state && location.state.bookingData) {
      setBookingData(location.state.bookingData);
    } else {
      const storedBooking = sessionStorage.getItem('completeBooking');
      if (storedBooking) {
        try {
          setBookingData(JSON.parse(storedBooking));
        } catch (error) {
          console.error('Error parsing stored booking data:', error);
          navigate('/home');
        }
      } else {
        // If no booking data, redirect to home
        navigate('/home');
      }
    }
  }, [navigate, location.state]);

  const handleConfirmBooking = async () => {
    // Build backend payload and create booking record.
    if (!bookingData) return;

    // Check if user is authenticated
    if (!user) {
      // Show message and redirect to login
      alert('Please log in to confirm your booking.');
      navigate('/login', { state: { from: location.pathname, bookingData } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingPayload = {
        userId: user.id,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        dateTime: bookingData.dateTime || `${bookingData.pickupDate}T${bookingData.pickupTime}`,
        passengers: bookingData.passengers || bookingData.passengerCount,
        serviceType: bookingData.serviceType || bookingData.selectedDriver?.vehicleType || 'Standard Taxi',
        typeOfService: bookingData.serviceType || bookingData.selectedDriver?.vehicleType || 'Standard Taxi',
        price: bookingData.price || parseFloat((bookingData.selectedDriver?.price || '0').replace('$', '')),
        specialRequests: bookingData.specialRequests || '',
        status: 'pending',
      };

      const response = await fetch(apiUrl('/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        await response.json();
        sessionStorage.removeItem('completeBooking');
        sessionStorage.removeItem('bookingData');
        setSuccess(true);
        // Redirect to my bookings after a short delay
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save booking');
      }
    } catch (error) {
      setError('Could not connect to server. Please try again.');
      console.error('Error saving booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = () => {
    // Return to booking form with current values for editing.
    navigate('/home', { state: { bookingData } });
  };

  if (!bookingData || !user) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="confirmation-container">
        <div className="confirmation-header">
          <div className="confirmation-icon">📋</div>
          <h1>Booking Confirmation</h1>
          <p>Please review your booking details before confirming</p>
        </div>

        {error && (
          <div className="auth-error">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="confirmation-success">
            <div className="success-icon">✅</div>
            <h2>Ride booked!</h2>
            <p>Your booking has been successfully saved. You will be redirected to your bookings shortly.</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="btn btn-primary"
            >
              View My Bookings
            </button>
          </div>
        ) : (
          <div className="confirmation-content">
            <div className="booking-summary">
              <h2>Booking Summary</h2>

              <div className="summary-section">
                <h3>Route Details</h3>
                <div className="summary-item">
                  <span className="summary-label">From:</span>
                  <span className="summary-value">{bookingData.pickupLocation}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">To:</span>
                  <span className="summary-value">{bookingData.dropoffLocation}</span>
                </div>
              </div>

              <div className="summary-section">
                <h3>Travel Details</h3>
                <div className="summary-item">
                  <span className="summary-label">Date & Time:</span>
                  <span className="summary-value">
                    {new Date(bookingData.dateTime || `${bookingData.pickupDate}T${bookingData.pickupTime}`).toLocaleString()}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Passengers:</span>
                  <span className="summary-value">{bookingData.passengers || bookingData.passengerCount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Service Type:</span>
                  <span className="summary-value">{bookingData.serviceType || bookingData.selectedDriver?.vehicleType || 'Standard Taxi'}</span>
                </div>
              </div>

              {bookingData.specialRequests && (
                <div className="summary-section">
                  <h3>Special Requests</h3>
                  <p className="special-requests">{bookingData.specialRequests}</p>
                </div>
              )}

              <div className="summary-section total-section">
                <div className="total-price">
                  <span className="total-label">Total Price:</span>
                  <span className="total-amount">${bookingData.price || (bookingData.selectedDriver?.price || '0').replace('$', '')}</span>
                </div>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                onClick={handleEditBooking}
                className="btn btn-secondary"
                disabled={loading}
              >
                Edit Booking
              </button>
              <button
                onClick={handleConfirmBooking}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Confirmation;
