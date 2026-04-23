import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pages.css';

// Service catalog page that pre-selects a service and routes user into booking flow.
function Services() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Static service options displayed as selectable cards.
  const services = [
    {
      id: 1,
      name: 'Economy',
      icon: '🚗',
      description: 'Budget-friendly rides for everyday commute',
      basePrice: 5.00,
      pricePerMile: 1.50,
      features: [
        'Affordable pricing',
        'Professional drivers',
        'GPS tracking',
        'Air conditioning'
      ],
      capacity: 4
    },
    {
      id: 2,
      name: 'Comfort',
      icon: '🚙',
      description: 'Mid-range comfortable rides with extra space',
      basePrice: 8.00,
      pricePerMile: 2.00,
      features: [
        'Spacious interior',
        'Climate control',
        'Premium audio',
        'Phone charger',
        'USB ports'
      ],
      capacity: 5
    },
    {
      id: 3,
      name: 'Premium',
      icon: '🚘',
      description: 'Luxury rides for special occasions',
      basePrice: 15.00,
      pricePerMile: 3.50,
      features: [
        'Luxury vehicle',
        'Premium seating',
        'Complimentary wifi',
        'Bottled water',
        'Professional attire',
        'Entertainment system'
      ],
      capacity: 4
    },
    {
      id: 4,
      name: 'XL',
      icon: '🚐',
      description: 'Large vehicle perfect for groups',
      basePrice: 12.00,
      pricePerMile: 2.80,
      features: [
        'Spacious 6-seater',
        'Extra luggage space',
        'Comfortable ride',
        'GPS tracking',
        'Climate control'
      ],
      capacity: 6
    }
  ];

  useEffect(() => {
    // Clear pending redirect timer when component unmounts.
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleServiceBooking = (service) => {
    // Debounce card interactions and redirect based on auth state.
    if (isRedirecting) {
      return;
    }

    setSelectedServiceId(service.id);
    setIsRedirecting(true);

    const storedUser = localStorage.getItem('user');
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
        <h2>How Our Pricing Works</h2>
        <div className="pricing-explanation">
          <p>
            Our transparent pricing model ensures you know exactly what to expect. 
            The final fare is calculated based on:
          </p>
          <ul>
            <li><strong>Base Fare:</strong> Applies to every ride you take</li>
            <li><strong>Distance Charge:</strong> Calculated per mile of travel</li>
            <li><strong>Time Charge:</strong> Applies during traffic delays</li>
            <li><strong>Surge Pricing:</strong> May apply during peak hours</li>
          </ul>
          <p className="pricing-note">
            💡 Tip: Book during off-peak hours for better rates!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Services;
