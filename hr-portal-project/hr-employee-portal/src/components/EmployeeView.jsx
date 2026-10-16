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
  const dispatch = useDispatch();
  const email = useSelector(selectLoggedInEmail);
  const { error } = useSelector(selectEmployeesState);
  const employeeProfile = useSelector((state) => selectEmployeeByEmail(state, email)) || {};

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Your Profile</h2>
        {error && <p role="alert">{error}</p>}

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