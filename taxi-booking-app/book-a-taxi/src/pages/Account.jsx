import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Pages.css';

function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    deleteCurrentPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState('account');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          age: userData.age ? String(userData.age) : '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
          deleteCurrentPassword: '',
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login', { state: { from: location } });
      }
    } else {
      navigate('/login', { state: { from: location } });
    }
    setLoading(false);
  }, [navigate, location]);

  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const parsedAge = parseInt(formData.age, 10);
      if (Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        newErrors.age = 'Please enter a valid age between 1 and 120';
      }
    }

    return newErrors;
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
    switch ((status || '').toLowerCase()) {
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

  const fetchBookings = async (targetUser = user) => {
    if (!targetUser) return;

    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const response = await fetch('http://localhost:3001/api/bookings');
      if (response.ok) {
        const data = await response.json();
        const userBookings = data.filter((booking) => booking.userId === targetUser.id);
        setBookings(userBookings);
      } else {
        setBookingsError('Failed to load bookings');
      }
    } catch (error) {
      setBookingsError('Could not connect to server. Please try again.');
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleViewBookings = async () => {
    setViewMode('bookings');
    await fetchBookings();
  };

  const handleBackToAccount = () => {
    setViewMode('account');
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 5) {
      newErrors.newPassword = 'New password must be at least 5 characters';
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'New passwords do not match';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
    setApiError(null);
    setSuccessMessage(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const newErrors = validateProfileForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: parseInt(formData.age, 10),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage and state
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setFormData((prev) => ({
          ...prev,
          age: data.user.age ? String(data.user.age) : '',
        }));
        setSuccessMessage('Profile updated successfully!');
      } else {
        setApiError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setApiError('Could not connect to server. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const newErrors = validatePasswordForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Password changed successfully!');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
          deleteCurrentPassword: '',
        });
        setShowPasswordChange(false);
      } else {
        setApiError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setApiError('Could not connect to server. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!formData.deleteCurrentPassword) {
      setErrors((prev) => ({
        ...prev,
        deleteCurrentPassword: 'Current password is required to delete account',
      }));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: formData.deleteCurrentPassword,
        }),
      });

      if (response.ok) {
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        const data = await response.json();
        setApiError(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setApiError('Could not connect to server. Please try again.');
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (viewMode === 'bookings') {
    return (
      <div className="container">
        <div className="account-container">
          <div className="account-header">
            <div className="account-icon">📋</div>
            <h1>My Bookings</h1>
            <p>View all your rides from inside Account</p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleBackToAccount}>
              ← Back to Account
            </button>
            <button type="button" className="btn btn-primary" onClick={() => fetchBookings()} disabled={bookingsLoading}>
              {bookingsLoading ? 'Refreshing...' : 'Refresh Bookings'}
            </button>
          </div>

          {bookingsError && (
            <div className="auth-error" style={{ marginTop: '20px' }}>
              ⚠️ {bookingsError}
            </div>
          )}

          {bookingsLoading ? (
            <div className="loading-spinner">Loading your bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="no-bookings" style={{ marginTop: '20px' }}>
              <div className="no-bookings-icon">🚗</div>
              <h2>No bookings yet</h2>
              <p>You haven't made any bookings yet.</p>
            </div>
          ) : (
            <div className="bookings-list" style={{ marginTop: '20px' }}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="account-container">
        <div className="account-header">
          <div className="account-icon">👤</div>
          <h1>My Account</h1>
          <p>Manage your account settings</p>
        </div>

        {apiError && (
          <div className="auth-error">
            ⚠️ {apiError}
          </div>
        )}

        {successMessage && (
          <div className="auth-success">
            ✅ {successMessage}
          </div>
        )}

        <div className="account-sections">
          {/* Profile Information */}
          <div className="account-section">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="account-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'form-control error' : 'form-control'}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'form-control error' : 'form-control'}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={errors.age ? 'form-control error' : 'form-control'}
                />
                {errors.age && <span className="error-message">{errors.age}</span>}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="text" className="form-control" value={user?.email || ''} disabled />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleViewBookings}>
                  View My Bookings
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="account-section">
            <h2>Change Password</h2>
            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="btn btn-secondary"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="account-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={errors.currentPassword ? 'form-control error' : 'form-control'}
                    placeholder="Enter current password"
                  />
                  {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={errors.newPassword ? 'form-control error' : 'form-control'}
                    placeholder="Enter new password (min 5 characters)"
                  />
                  {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    className={errors.confirmNewPassword ? 'form-control error' : 'form-control'}
                    placeholder="Confirm new password"
                  />
                  {errors.confirmNewPassword && <span className="error-message">{errors.confirmNewPassword}</span>}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setFormData({
                        ...formData,
                        currentPassword: '',
                        newPassword: '',
                        confirmNewPassword: '',
                      });
                      setErrors({});
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Actions */}
          <div className="account-section">
            <h2>Account Actions</h2>
            <div className="account-actions">
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                Logout
              </button>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-danger"
                >
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirm">
                  <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                  <div className="form-group">
                    <label htmlFor="deleteCurrentPassword">Current Password</label>
                    <input
                      type="password"
                      id="deleteCurrentPassword"
                      name="deleteCurrentPassword"
                      value={formData.deleteCurrentPassword}
                      onChange={handleChange}
                      className={errors.deleteCurrentPassword ? 'form-control error' : 'form-control'}
                      placeholder="Enter current password to confirm"
                    />
                    {errors.deleteCurrentPassword && <span className="error-message">{errors.deleteCurrentPassword}</span>}
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={handleDeleteAccount}
                      className="btn btn-danger"
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete Account'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
