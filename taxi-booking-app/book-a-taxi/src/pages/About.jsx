import './Pages.css';

function About() {
  return (
    <div className="container about-main">
      <h1 className="heading">About Book a Taxi</h1>

      <div className="about-section">
        <h2>The Project</h2>
        <p>
          Book a Taxi is a portfolio application for exploring a ride-booking workflow.
          Create an account, enter a trip, choose a sample driver and save a booking
          with a fixed demo fare.
        </p>
        <p>
          Drivers, vehicle details, ratings and fares are fictional sample data.
          Bookings stay within this application; they do not dispatch a vehicle
          or collect a payment.
        </p>
      </div>

      <div className="about-section">
        <h2>How It Works</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon" aria-hidden="true">1</div>
            <h3>Plan</h3>
            <p>Enter pickup and dropoff locations, a future date and your passenger count.</p>
          </div>
          <div className="value-card">
            <div className="value-icon" aria-hidden="true">2</div>
            <h3>Choose</h3>
            <p>Select a service and matching sample driver, then review the quoted fare.</p>
          </div>
          <div className="value-card">
            <div className="value-icon" aria-hidden="true">3</div>
            <h3>Confirm</h3>
            <p>Save your booking and view it in My Bookings.</p>
          </div>
          <div className="value-card">
            <div className="value-icon" aria-hidden="true">4</div>
            <h3>Manage</h3>
            <p>Cancel an upcoming booking or update your account details.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>Included Features</h2>
        <ul className="benefits-list">
          <li>Account registration and sign-in</li>
          <li>Service and sample driver selection</li>
          <li>Fixed fares shown before confirmation</li>
          <li>Saved booking drafts and retryable confirmations</li>
          <li>A private list of your active bookings</li>
          <li>Cancellation before pickup time</li>
          <li>Profile updates, password changes and account deletion</li>
          <li>A contact form that previews validation without sending a message</li>
        </ul>
      </div>
    </div>
  );
}

export default About;
