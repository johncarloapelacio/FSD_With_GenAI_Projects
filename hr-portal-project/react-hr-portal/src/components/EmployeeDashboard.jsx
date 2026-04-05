import { Link, Outlet, useNavigate } from "react-router-dom";
import "./EmployeeDashboard.css";

function EmployeeDashboard() {

let emailId = sessionStorage.getItem("emailId");

let navigate = useNavigate();

let logout = ()=> { 
    sessionStorage.removeItem("emailId");
    navigate("/");
}

return(
    <div className="emp-dashboard-container">

        {/* Header */}
        <div className="emp-header">
            <h2>Employee Dashboard</h2>
            <button className="emp-logout-btn" onClick={logout}>Logout</button>
        </div>

        {/* Welcome Section */}
        <div className="emp-welcome">
            <h3>Welcome, {emailId}</h3>
        </div>

        {/* Navigation */}
        <div className="emp-nav">
            <Link to="viewEmployee">Profile</Link>
            <Link to="applyLeave">Apply Leave</Link>
            <Link to="viewLeaveStatus">Leave Status</Link>
        </div>

        {/* Content */}
        <div className="emp-content">
            <Outlet/>
        </div>

    </div>
)
}

export default EmployeeDashboard;