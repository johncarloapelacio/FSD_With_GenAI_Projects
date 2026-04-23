import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  selectEmployeesState,
} from "../store/slices/employeesSlice";
import { logoutUser } from "../store/slices/authSlice";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  // Core hooks and selectors for employee dashboard data and navigation.
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status } = useSelector(selectEmployeesState);

  // Loads employee records once so greeting/profile data can be resolved locally.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchEmployees());
    }
  }, [dispatch, status]);

  // Clears session auth state and routes user to login.
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  return (
    <div className="emp-dashboard-container">
      <div className="emp-header">
        <h2>Employee Dashboard</h2>
        <button className="emp-logout-btn" onClick={handleLogout}>Log Out</button>
      </div>

      {/* Navigation bar with persistent links to all employee sub-sections. */}
      <div className="emp-nav">
        <Link to="viewEmployee">Profile</Link>
        <Link to="applyLeave">Apply Leave</Link>
        <Link to="viewLeaveStatus">Leave Status</Link>
      </div>

      {/* Outlet renders the active child route: index welcome, profile, leave form, or leave status. */}
      <div className="emp-content">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeDashboard;