import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiUrl } from '../api';
import './Pages.css';

function MyBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelingBookingId, setCancelingBookingId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login', { state: { from: location } });
      return;
    }

    fetchBookings();
  }, [navigate, location]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(apiUrl('/bookings'));
      if (response.ok) {
        const data = await response.json();
        // Filter bookings for current user
        const user = JSON.parse(localStorage.getItem('user'));
        const userBookings = data.filter(
          (booking) => booking.userId === user.id && (booking.status || '').toLowerCase() !== 'cancelled'
        );
        setBookings(userBookings);
      } else {
        setError('Failed to load bookings');
      }
    } catch (error) {
      setError('Could not connect to server. Please try again.');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      case 'completed':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) {
      return;
    }

    setCancelingBookingId(bookingId);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/bookings/${bookingId}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to cancel booking');
        return;
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    } catch (cancelError) {
      setError('Could not connect to server. Please try again.');
      console.error('Error canceling booking:', cancelError);
    } finally {
      setCancelingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="bookings-container">
        <div className="bookings-header">
          <div className="bookings-icon">📋</div>
          <h1>My Bookings</h1>
          <p>View and manage your ride bookings</p>
        </div>

        {error && (
          <div className="auth-error">
            ⚠️ {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <div className="no-bookings-icon">🚗</div>
            <h2>No bookings yet</h2>
            <p>You haven't made any bookings yet. Start by booking a ride!</p>
            <button
              onClick={() => navigate('/home')}
              className="btn btn-primary"
            >
              Book a Ride
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-id">Booking #{booking.id}</div>
                  <div
                    className="booking-status"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </div>
                </div>

                <div className="booking-details">
                  <div className="booking-info">
                    <div className="info-item">
                      <span className="info-label">Pickup:</span>
                      <span className="info-value">{booking.pickupLocation}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dropoff:</span>
                      <span className="info-value">{booking.dropoffLocation}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Date & Time:</span>
                      <span className="info-value">{formatDate(booking.dateTime)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Passengers:</span>
                      <span className="info-value">{booking.passengers}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Service:</span>
                      <span className="info-value">{booking.typeOfService || booking.serviceType}</span>
                    </div>
                  </div>

                  <div className="booking-price">
                    <div className="price-amount">${booking.price}</div>
                    <div className="price-label">Total</div>
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="booking-special-requests">
                    <span className="requests-label">Special Requests:</span>
                    <span className="requests-value">{booking.specialRequests}</span>
                  </div>
                )}

                {booking.driver && (
                  <div className="booking-driver">
                    <div className="driver-info">
                      <div className="driver-avatar">👨‍🚗</div>
                      <div className="driver-details">
                        <div className="driver-name">{booking.driver.name}</div>
                        <div className="driver-rating">⭐ {booking.driver.rating}</div>
                      </div>
                    </div>
                    <div className="driver-vehicle">
                      <div className="vehicle-model">{booking.driver.vehicle}</div>
                      <div className="vehicle-plate">{booking.driver.plate}</div>
                    </div>
                  </div>
                )}

                <div className="booking-actions">
                  {booking.status.toLowerCase() === 'pending' && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancelingBookingId === booking.id}
                    >
                      {cancelingBookingId === booking.id ? 'Canceling...' : 'Cancel Booking'}
                    </button>
                  )}
                  {booking.status.toLowerCase() === 'confirmed' && (
                    <button className="btn btn-secondary btn-small">
                      Contact Driver
                    </button>
                  )}
                  {booking.status.toLowerCase() === 'completed' && (
                    <button className="btn btn-primary btn-small">
                      Rate & Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
