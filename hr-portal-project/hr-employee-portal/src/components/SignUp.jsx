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
  inviteCode: "",
};

const SignUp = () => {
  const dispatch = useDispatch();

  const [form, setForm] = useState(initialFormState);
  const [isVerificationStep, setIsVerificationStep] = useState(true);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email) {
      setMessage("Email is required");
      return;
    }

    try {
      const payload = await dispatch(verifyEmployeeEmail({ email: form.email, inviteCode: form.inviteCode })).unwrap();
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
            <div className="form-group">
              <label htmlFor="invite-code">Invitation code from HR</label>
              <input id="invite-code" name="inviteCode" value={form.inviteCode} onChange={handleChange} required autoComplete="off" />
            </div>
            <button className="signup-btn">Verify Invitation</button>
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
                placeholder="At least 10 characters"
                minLength={10}
                maxLength={128}
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
                min="16"
                max="120"
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
