import { Link, Outlet, useNavigate } from "react-router-dom";
import "./HRDashboard.css";

const HRDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>HR Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
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