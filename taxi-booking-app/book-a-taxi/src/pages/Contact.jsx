import { useState } from 'react';
import './Pages.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const formatPhoneNumber = (input) => {
    const digitsOnly = input.replace(/\D/g, '');

    // Accept common US-style entries like "+1 555..." by trimming a leading country code.
    const normalizedDigits =
      digitsOnly.length === 11 && digitsOnly.startsWith('1')
        ? digitsOnly.slice(1)
        : digitsOnly;

    const limitedDigits = normalizedDigits.slice(0, 10);
    const len = limitedDigits.length;

    if (len === 0) return '';
    if (len < 4) return `(${limitedDigits}`;
    if (len < 7) return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  };

  const validatePhone = (phone) => {
    const formattedPhone = formatPhoneNumber(phone);
    const re = /^\(\d{3}\) \d{3}-\d{4}$/;
    return re.test(formattedPhone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const nextValue = name === 'phone' ? formatPhoneNumber(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  return (
    <div className="container contact-main">
      <h1 className="heading">Contact Us</h1>
      <p className="subheading">
        Try the sample form below. It validates your entries locally and does not send messages.
      </p>

      <div className="contact-content">
        <div className="contact-info">
          <h2>Sample Contact Details</h2>
          <p>These details are placeholders for the contact-page layout.</p>
          <div className="contact-details">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div>
                <h4>Address</h4>
                <p>123 Example Avenue<br />Example City, NY 10001</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div>
                <h4>Phone</h4>
                <p>+1 (212) 555-0100<br />Sample number only</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">✉️</div>
              <div>
                <h4>Email</h4>
                <p>support@bookataxi.example.test<br />info@bookataxi.example.test</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">⏰</div>
              <div>
                <h4>Business Hours</h4>
                <p>No live support service<br />Portfolio demonstration</p>
              </div>
            </div>
          </div>


        </div>

        <div className="contact-form-wrapper">
          <h2>Preview a Message</h2>

          {submitted && (
            <div className="success-message">
              ✅ Your message passed validation. This portfolio demo does not send messages.
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                className={errors.subject ? 'input-error' : ''}
              />
              {errors.subject && <span className="error-message">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please tell us more... (minimum 10 characters)"
                rows="5"
                className={errors.message ? 'input-error' : ''}
              />
              {errors.message && <span className="error-message">{errors.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary">
              Validate Message
            </button>
          </form>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How do I book a ride?</h4>
            <p>Visit our home page, enter your pickup and dropoff locations, and select a driver from the available options.</p>
          </div>
          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>This demo does not collect payments. Fares are sample quotes.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel my booking?</h4>
            <p>You can cancel any upcoming confirmed demo ride before its pickup time.</p>
          </div>
          <div className="faq-item">
            <h4>Are your drivers verified?</h4>
            <p>Driver profiles are fictional sample data; this demo does not dispatch rides.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
