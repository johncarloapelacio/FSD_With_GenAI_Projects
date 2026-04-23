import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectLoggedInEmail } from "../store/slices/authSlice";
import "./HRDashboard.css";

// Welcome screen rendered when the HR dashboard is first accessed with no child route active.
const HRWelcome = () => {
  // Retrieve the logged-in HR email from Redux auth state.
  const email = useSelector(selectLoggedInEmail);

  return (
    <div className="hr-welcome-container">
      <div className="hr-welcome-card">
        <h2 className="hr-welcome-title">Welcome to the HR Portal</h2>
        <p className="hr-welcome-email">{email}</p>
        <p className="hr-welcome-subtitle">
          Use the navigation above to manage employees, view the team directory,
          or review pending leave requests.
        </p>
        {/* Quick-access links navigate to each HR sub-route and replace this welcome view. */}
        <div className="hr-welcome-actions">
          <Link to="addEmployee" className="hr-welcome-action-item">
            <span className="hr-welcome-action-icon">➕</span>
            <span>Add Employee — Register a new team member</span>
          </Link>
          <Link to="viewEmployees" className="hr-welcome-action-item">
            <span className="hr-welcome-action-icon">👥</span>
            <span>View Employees — Browse the employee directory</span>
          </Link>
          <Link to="viewAllLeaveInfo" className="hr-welcome-action-item">
            <span className="hr-welcome-action-icon">📋</span>
            <span>Leave Info — Approve or deny pending leave requests</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HRWelcome;
