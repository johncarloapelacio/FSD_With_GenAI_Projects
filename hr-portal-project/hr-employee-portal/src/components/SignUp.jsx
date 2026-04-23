import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  completeEmployeeSignup,
  verifyEmployeeEmail,
} from "../store/slices/employeesSlice";
import "./SignUp.css";

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  age: "",
  password: "",
  employeeId: "",
};

const SignUp = () => {
  // Hook setup for dispatching signup flow actions.
  const dispatch = useDispatch();

  // Form state tracks both verification and completion steps.
  const [form, setForm] = useState(initialFormState);
  const [isVerificationStep, setIsVerificationStep] = useState(true);
  const [message, setMessage] = useState("");

  // Generic input handler for both signup steps.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: verifies that the entered email belongs to an eligible employee.
  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email) {
      setMessage("Email is required");
      return;
    }

    try {
      const payload = await dispatch(verifyEmployeeEmail(form.email)).unwrap();
      setForm((prev) => ({
        ...prev,
        employeeId: payload.employeeId,
        department: payload.department,
        email: payload.email,
      }));
      setIsVerificationStep(false);
    } catch (errorMessage) {
      setMessage(errorMessage || "Verification failed. Please try again.");
    }
  };

  // Step 2: submits signup details and finalizes employee account creation.
  const handleSignUp = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.password || !form.age || !form.firstName || !form.lastName) {
      setMessage("All fields are required");
      return;
    }

    try {
      await dispatch(completeEmployeeSignup(form)).unwrap();

      setMessage("Sign Up successful");
      setForm(initialFormState);
      setIsVerificationStep(true);
    } catch (errorMessage) {
      setMessage(errorMessage || "Sign up failed. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Employee Sign Up</h2>

        {isVerificationStep ? (
          <form onSubmit={handleVerifyEmail}>
            <div className="form-group">
              <label htmlFor="verify-email">Registered Email</label>
              <input
                id="verify-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your company email"
              />
            </div>
            <button className="signup-btn">Verify Email</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email-display">Email</label>
              <input id="email-display" type="email" value={form.email} readOnly />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input id="department" type="text" value={form.department} readOnly />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="Enter age"
              />
            </div>

            <button className="signup-btn">Complete Sign Up</button>
          </form>
        )}

        {message && <p className="app-message">{message}</p>}

        <p className="signin-link">
          Already have an account? <Link to="/">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
