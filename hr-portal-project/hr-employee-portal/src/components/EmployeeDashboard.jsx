import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const [employeeName, setEmployeeName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadEmployeeGreeting();
  }, []);

  const loadEmployeeGreeting = async () => {
    try {
      const email = sessionStorage.getItem("userEmail");
      if (!email) {
        navigate("/");
        return;
      }

      const { data } = await axios.get(API_ENDPOINTS.EMPLOYEES);
      const employee = data.find(emp => emp.emailId === email);
      setEmployeeName(employee?.fname || "");
    } catch (error) {
      console.error("Load employee greeting error:", error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <div className="emp-dashboard-container">
      <div className="emp-header">
        <h2>Employee Dashboard</h2>
        <button className="emp-logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="emp-welcome">
        <h3>Welcome, {employeeName}!</h3>
      </div>

      <div className="emp-nav">
        <Link to="viewEmployee">Profile</Link>
        <Link to="applyLeave">Apply Leave</Link>
        <Link to="viewLeaveStatus">Leave Status</Link>
      </div>

      <div className="emp-content">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeDashboard;