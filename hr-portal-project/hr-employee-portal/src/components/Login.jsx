import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import "./Login.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "", userType: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email || !form.password || !form.userType) {
      setMessage("All fields are required");
      return;
    }

    try {
      const { data } = await axios.get(API_ENDPOINTS.CREDENTIALS);
      const user = data.find(record =>
        record.emailId === form.email &&
        record.password === form.password &&
        record.typeOfUser === form.userType
      );

      if (!user) {
        setMessage("Invalid Email / Password / User Type");
        return;
      }

      if (form.userType === "hr") {
        alert("HR login successful");
        navigate("/hrHome");
      } else {
        sessionStorage.setItem("userEmail", form.email);
        alert("Employee login successful");
        navigate("/employeeHome");
      }
    } catch (error) {
      setMessage("Login failed. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>

        <form onSubmit={handleSignIn} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
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
            <label>User Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="hr"
                  onChange={handleChange}
                /> HR
              </label>

              <label>
                <input
                  type="radio"
                  name="userType"
                  value="employee"
                  onChange={handleChange}
                /> Employee
              </label>
            </div>
          </div>

          <button type="submit" className="login-btn">Sign In</button>
        </form>

        <p className="signup-text">
          Don't have an account? <Link to="signUp">Sign Up</Link>
        </p>

        {message && <p className="error-msg">{message}</p>}
      </div>
    </div>
  );
};

export default Login;
