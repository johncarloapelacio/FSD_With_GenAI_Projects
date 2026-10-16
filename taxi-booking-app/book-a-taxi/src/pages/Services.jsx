import { apiFetch, apiUrl } from '../api';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pages.css';

function Services() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    apiFetch(apiUrl('/services'), { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Could not load services');
      setServices(await response.json());
    }).catch(error => { if (error.name !== 'AbortError') setError('Could not load services. Please refresh to try again.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    // Clear pending redirect timer when component unmounts.
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleServiceBooking = (service) => {
    if (isRedirecting) {
      return;
    }

    setSelectedServiceId(service.id);
    setIsRedirecting(true);

    const storedUser = sessionStorage.getItem('user');
    redirectTimerRef.current = setTimeout(() => {
      if (!storedUser) {
        navigate('/login');
        return;
      }

      navigate('/home', { state: { selectedService: service.name } });
    }, 180);
  };

  return (
    <div className="container services-main">
      <h1 className="heading">Our Services</h1>
      <p className="subheading">
        Choose the perfect ride service for your needs
      </p>

      {error && <p role="alert">{error}</p>}
      {!services.length && !error && <p role="status">Loading services...</p>}
      <div className="services-grid">
        {services.map((service) => (
          <div
            key={service.id}
            className={`service-card ${selectedServiceId === service.id ? 'service-card-selected' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => handleServiceBooking(service)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleServiceBooking(service);
              }
            }}
          >
            <div className="service-icon">{service.icon}</div>
            <h3>{service.name}</h3>
            <p className="service-description">{service.description}</p>

            <div className="service-pricing">
              <div className="price-detail">
                <span className="price-label">Base:</span>
                <span className="price-value">${service.basePrice.toFixed(2)}</span>
              </div>
              <div className="price-detail">
                <span className="price-label">Per Mile:</span>
                <span className="price-value">${service.pricePerMile.toFixed(2)}</span>
              </div>
            </div>

            <div className="service-capacity">
              <strong>Capacity:</strong> Up to {service.capacity} passengers
            </div>

            <div className="service-features">
              <strong>Features:</strong>
              <ul className="features-list">
                {service.features.map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>

            <button
              className="btn btn-service"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleServiceBooking(service);
              }}
              disabled={isRedirecting}
            >
              Book {service.name}
            </button>
          </div>
        ))}
      </div>

      <div className="services-info">
        <h2>Additional Services Available</h2>
        <div className="additional-services">
          <div className="additional-service">
            <div className="service-icon-small">🎁</div>
            <h4>Special Occasions</h4>
            <p>Surprise your loved ones with our premium ride service on special days</p>
          </div>
          <div className="additional-service">
            <div className="service-icon-small">👥</div>
            <h4>Corporate Rides</h4>
            <p>Reliable transportation for business meetings and corporate events</p>
          </div>
          <div className="additional-service">
            <div className="service-icon-small">✈️</div>
            <h4>Airport Transfers</h4>
            <p>Pre-booked rides to and from airports with guaranteed punctuality</p>
          </div>
          <div className="additional-service">
            <div className="service-icon-small">📦</div>
            <h4>Scheduled Rides</h4>
            <p>Schedule your regular commute rides in advance for better rates</p>
          </div>
        </div>
      </div>

      <div className="pricing-info">
        <h2>Demo Pricing</h2>
        <p>Driver cards show fixed sample quotes. The example quotes use each service's base fare plus five miles and fifteen minutes at its published rates. They are independent of the addresses you enter; this demo does not calculate live routes, surge pricing or payments.</p>
      </div>
    </div>
  );
}

export default Services;
