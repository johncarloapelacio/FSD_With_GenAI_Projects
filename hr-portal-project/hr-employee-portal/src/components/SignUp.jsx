import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
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
      const { data } = await axios.get(API_ENDPOINTS.EMPLOYEES);
      const employee = data.find(emp => emp.emailId === form.email);

      if (!employee) {
        setMessage("You are not part of the organization");
        return;
      }

      if (employee.signedUp) {
        setMessage("You are already signed up");
        return;
      }

      setForm(prev => ({
        ...prev,
        employeeId: employee.id,
        department: employee.department,
        email: employee.emailId,
      }));
      setIsVerificationStep(false);
    } catch (error) {
      setMessage("Verification failed. Please try again.");
      console.error("Verification error:", error);
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
      const employeeData = {
        fname: form.firstName,
        lname: form.lastName,
        emailId: form.email,
        password: form.password,
        department: form.department,
        age: form.age,
        signedUp: true,
      };

      const loginData = {
        emailId: form.email,
        password: form.password,
        typeOfUser: "employee",
      };

      await axios.patch(`${API_ENDPOINTS.EMPLOYEES}/${form.employeeId}`, employeeData);
      await axios.post(API_ENDPOINTS.CREDENTIALS, loginData);

      setMessage("Sign Up successful");
      setForm(initialFormState);
      setIsVerificationStep(true);
    } catch (error) {
      setMessage("Sign up failed. Please try again.");
      console.error("Sign up error:", error);
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

        {message && <p className="message">{message}</p>}

        <p className="signin-link">
          Already have an account? <Link to="/">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
