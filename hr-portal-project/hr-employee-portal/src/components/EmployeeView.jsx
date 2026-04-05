import axios from "axios";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./EmployeeView.css";

const EmployeeView = () => {
  const [employeeProfile, setEmployeeProfile] = useState({});

  useEffect(() => {
    loadEmployeeProfile();
  }, []);

  const loadEmployeeProfile = async () => {
    try {
      const email = sessionStorage.getItem("userEmail");
      if (!email) return;

      const { data } = await axios.get(API_ENDPOINTS.EMPLOYEES);
      const employee = data.find(emp => emp.emailId === email);
      setEmployeeProfile(employee || {});
    } catch (error) {
      console.error("Load employee profile error:", error);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Your Profile</h2>

        <div className="profile-row">
          <span>First Name</span>
          <span>{employeeProfile.fname || "-"}</span>
        </div>

        <div className="profile-row">
          <span>Last Name</span>
          <span>{employeeProfile.lname || "-"}</span>
        </div>

        <div className="profile-row">
          <span>Email</span>
          <span>{employeeProfile.emailId || "-"}</span>
        </div>

        <div className="profile-row">
          <span>Age</span>
          <span>{employeeProfile.age || "-"}</span>
        </div>

        <div className="profile-row">
          <span>Department</span>
          <span>{employeeProfile.department || "-"}</span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;