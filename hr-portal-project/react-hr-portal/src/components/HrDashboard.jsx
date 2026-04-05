import { Link, Outlet, useNavigate } from "react-router-dom";
import "./HrDashboard.css";

function HrDashboard() {

let navigate = useNavigate();

let logout = ()=> {
    navigate("/");
}

return(
    <div className="dashboard-container">

        {/* Header */}
        <div className="dashboard-header">
            <h2>HR Dashboard</h2>
            <button className="logout-btn" onClick={logout}>Logout</button>
        </div>

        {/* Navigation */}
        <div className="dashboard-nav">
            <Link to="addEmployee">Add Employee</Link>
            <Link to="viewEmployees">View Employees</Link>
            <Link to="viewAllLeaveInfo">Leave Info</Link>
        </div>

        {/* Content Area */}
        <div className="dashboard-content">
            <Outlet/>
        </div>

    </div>
)
}

export default HrDashboard;