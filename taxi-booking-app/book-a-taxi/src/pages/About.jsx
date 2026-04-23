import './Pages.css';

// Static informational page describing product story, values, and highlights.
function About() {
  return (
    <div className="container about-main">
      <h1 className="heading">About Book a Taxi</h1>

      <div className="about-section">
        <h2>Our Story</h2>
        <p>
          Book a Taxi was founded in 2020 with a simple mission: to make transportation convenient, 
          affordable, and reliable for everyone. What started as a small local service has grown into 
          a trusted platform serving thousands of customers daily.
        </p>
        <p>
          We believe that quality transportation should be accessible to all, which is why we've built 
          our platform with affordability, transparency, and customer satisfaction at its core.
        </p>
      </div>

      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          To provide safe, reliable, and affordable ride-sharing services that enhance mobility 
          and connectivity in urban and suburban communities.
        </p>
      </div>

      <div className="about-section">
        <h2>Our Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">🚀</div>
            <h3>Innovation</h3>
            <p>We continuously improve our platform with cutting-edge technology.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🛡️</div>
            <h3>Safety</h3>
            <p>Your safety is our top priority in every ride.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">💚</div>
            <h3>Community</h3>
            <p>We support local drivers and communities we serve.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">✨</div>
            <h3>Excellence</h3>
            <p>We deliver exceptional service every single time.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>Why Choose Book a Taxi?</h2>
        <ul className="benefits-list">
          <li>✓ Professional and verified drivers with background checks</li>
          <li>✓ Transparent pricing with no hidden charges</li>
          <li>✓ Real-time tracking of your ride</li>
          <li>✓ 24/7 customer support</li>
          <li>✓ Multiple payment options</li>
          <li>✓ Eco-friendly vehicle options available</li>
          <li>✓ Special discounts for frequent users</li>
          <li>✓ Safe and secure ride experience</li>
        </ul>
      </div>

      <div className="about-section">
        <h2>Our Team</h2>
        <p>
          Our team of dedicated professionals works tirelessly to ensure that every ride with 
          Book a Taxi is a great experience. From our customer support staff to our technology 
          team, everyone is committed to making your journey smooth and enjoyable.
        </p>
      </div>

      <div className="about-section stats-section">
        <h2>By The Numbers</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">2000+</div>
            <div className="stat-label">Active Drivers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">500K+</div>
            <div className="stat-label">Completed Rides</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4.8★</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
