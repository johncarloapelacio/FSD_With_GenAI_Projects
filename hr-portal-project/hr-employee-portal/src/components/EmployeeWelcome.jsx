import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectLoggedInEmail } from "../store/slices/authSlice";
import {
  selectEmployeeByEmail,
} from "../store/slices/employeesSlice";
import "./EmployeeDashboard.css";

// Welcome screen rendered when the Employee dashboard is first accessed with no child route active.
const EmployeeWelcome = () => {
  // Retrieve the logged-in employee email and resolve their profile from Redux state.
  const email = useSelector(selectLoggedInEmail);
  const employee = useSelector((state) => selectEmployeeByEmail(state, email));
  const firstName = employee?.fname || "";

  return (
    <div className="emp-welcome-container">
      <div className="emp-welcome-card">
        <h2 className="emp-welcome-title">
          {firstName ? `Welcome, ${firstName}!` : "Welcome to the Employee Portal"}
        </h2>
        <p className="emp-welcome-email">{email}</p>
        <p className="emp-welcome-subtitle">
          Use the navigation above or the quick links below to manage your
          profile, submit leave requests, or track existing leave status.
        </p>
        {/* Quick-access links navigate to each employee sub-route and replace this welcome view. */}
        <div className="emp-welcome-actions">
          <Link to="viewEmployee" className="emp-welcome-action-item">
            <span className="emp-welcome-action-icon">👤</span>
            <span>Profile — View your personal information</span>
          </Link>
          <Link to="applyLeave" className="emp-welcome-action-item">
            <span className="emp-welcome-action-icon">📝</span>
            <span>Apply Leave — Submit a new leave request</span>
          </Link>
          <Link to="viewLeaveStatus" className="emp-welcome-action-item">
            <span className="emp-welcome-action-icon">📊</span>
            <span>Leave Status — Track your leave request outcomes</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeWelcome;
