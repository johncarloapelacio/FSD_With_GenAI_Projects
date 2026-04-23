import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  clearAuthError,
  loginUser,
  selectAuth,
  selectIsAuthenticated,
} from "../store/slices/authSlice";
import "./Login.css";

const Login = () => {
  // Local form state and transient validation message for login UX.
  const [form, setForm] = useState({ email: "", password: "", userType: "" });
  const [message, setMessage] = useState("");

  // Redux and navigation hooks for auth flow orchestration.
  const dispatch = useDispatch();
  const { error, status, userType } = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  // Redirect users to their role dashboard after successful authentication.
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    navigate(userType === "hr" ? "/hrHome" : "/employeeHome");
  }, [isAuthenticated, navigate, userType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Validates form inputs and dispatches login thunk.
  const handleSignIn = async (event) => {
    event.preventDefault();
    setMessage("");
    dispatch(clearAuthError());

    if (!form.email || !form.password || !form.userType) {
      setMessage("All fields are required");
      return;
    }

    try {
      await dispatch(loginUser(form)).unwrap();
      alert(form.userType === "hr" ? "HR login successful" : "Employee login successful");
    } catch {
      return;
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

          <button type="submit" className="login-btn" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="signup-text">
          Don't have an account? <Link to="signUp">Sign Up</Link>
        </p>

        {message && <p className="app-message">{message}</p>}
        {error && <p className="app-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
