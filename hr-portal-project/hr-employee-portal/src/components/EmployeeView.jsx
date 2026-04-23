import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  selectEmployeeByEmail,
  selectEmployeesState,
} from "../store/slices/employeesSlice";
import { selectLoggedInEmail } from "../store/slices/authSlice";
import "./EmployeeView.css";

const EmployeeView = () => {
  // Resolves the logged-in employee profile from Redux state by email key.
  const dispatch = useDispatch();
  const email = useSelector(selectLoggedInEmail);
  const { status } = useSelector(selectEmployeesState);
  const employeeProfile = useSelector((state) => selectEmployeeByEmail(state, email)) || {};

  // Ensures employee data is loaded before rendering profile fields.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchEmployees());
    }
  }, [dispatch, status]);

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