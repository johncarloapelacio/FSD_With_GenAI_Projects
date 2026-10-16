import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/slices/authSlice";
import "./HRDashboard.css";

const HRDashboard = () => {
  // Dashboard-level hooks for logout dispatch and route transitions.
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Clears auth state and returns user to public login page.
  const handleLogout = async () => {
    try { await dispatch(logoutUser()).unwrap(); navigate("/"); }
    catch { window.alert("Could not sign out. Please try again."); }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>HR Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </div>

      <div className="dashboard-nav">
        <Link to="addEmployee">Add Employee</Link>
        <Link to="viewEmployees">View Employees</Link>
        <Link to="viewAllLeaveInfo">Leave Info</Link>
      </div>

      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
};

export default HRDashboard;