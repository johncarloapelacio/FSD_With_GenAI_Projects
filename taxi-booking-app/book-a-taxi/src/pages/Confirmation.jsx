import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiUrl, apiFetch } from '../api';
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
    const storedUser = sessionStorage.getItem('user');
    let currentUserId = null;
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        currentUserId = userData.id;
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Don't redirect, just set user to null
      }
    }

    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('completeBooking')); } catch { sessionStorage.removeItem('completeBooking'); }
    const draft = saved?.submissionAttempted ? saved : location.state?.bookingData || saved;
    if (!draft) { navigate('/home'); return; }
    if (draft.submissionOwnerId && draft.submissionOwnerId !== currentUserId) { sessionStorage.removeItem('completeBooking'); sessionStorage.removeItem('bookingData'); navigate('/home'); return; }
    const stableDraft = { ...draft, requestId: draft.requestId || crypto.randomUUID() };
    sessionStorage.setItem('completeBooking', JSON.stringify(stableDraft));
    setBookingData(stableDraft);
  }, [navigate, location.state]);

  const handleConfirmBooking = async () => {
    // Build backend payload and create booking record.
    if (!bookingData || loading || success) return;

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
      const bookingPayload = bookingData.submissionPayload || {
        requestId: bookingData.requestId,
        driverId: bookingData.selectedDriver?.id,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        dateTime: new Date(bookingData.dateTime || `${bookingData.pickupDate}T${bookingData.pickupTime}`).toISOString(),
        passengers: bookingData.passengers || bookingData.passengerCount,
        serviceType: bookingData.serviceType || bookingData.selectedDriver?.vehicleType || 'Standard Taxi',
        specialRequests: bookingData.specialRequests || '',
      };

      const attempted = { ...bookingData, submissionAttempted: true, submissionOwnerId: user.id, submissionPayload: bookingPayload };
      sessionStorage.setItem('completeBooking', JSON.stringify(attempted));
      setBookingData(attempted);
      const response = await apiFetch(apiUrl('/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.booking.status !== "confirmed") {
          sessionStorage.removeItem("completeBooking");
          sessionStorage.removeItem("bookingData");
          navigate("/my-bookings");
          return;
        }
        sessionStorage.removeItem('completeBooking');
        sessionStorage.removeItem('bookingData');
        setSuccess(true);

      } else {
        const errorData = await response.json();
        if (response.status === 400) {
          const editable = { ...bookingData, submissionAttempted: false };
          delete editable.submissionPayload;
          sessionStorage.setItem('completeBooking', JSON.stringify(editable));
          setBookingData(editable);
        }
        setError(errorData.error || 'Could not confirm the booking. Retry this confirmation or review My Bookings.');
      }
    } catch (error) {
      setError('The confirmation response was not received. Retry uses the same request and will not create a second booking.');
      console.error('Error saving booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = () => {
    // Return to booking form with current values for editing.
    if (bookingData.submissionAttempted) return;
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
            <p>Your booking has been saved. View your bookings to manage this ride.</p>
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

            {bookingData.submissionAttempted && <p role="status">A confirmation has been submitted. Retry to retrieve its result, or review My Bookings before starting another ride.</p>}
            <div className="confirmation-actions">
              <button
                onClick={handleEditBooking}
                className="btn btn-secondary"
                disabled={loading || bookingData.submissionAttempted}
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
