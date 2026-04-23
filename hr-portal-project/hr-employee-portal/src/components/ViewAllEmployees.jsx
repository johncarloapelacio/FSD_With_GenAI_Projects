import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  selectAllEmployees,
  selectEmployeesState,
} from "../store/slices/employeesSlice";
import "./ViewAllEmployees.css";

const ViewAllEmployees = () => {
  // Pulls employee list and request status from centralized Redux state.
  const dispatch = useDispatch();
  const employees = useSelector(selectAllEmployees);
  const { status } = useSelector(selectEmployeesState);

  // Fetch employees once when entering this screen.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchEmployees());
    }
  }, [dispatch, status]);

  return (
    <div className="table-container">
      <div className="table-card">
        <h2>All Employees</h2>

        <table className="employee-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Department</th>
            </tr>
          </thead>

          <tbody>
            {employees.length > 0 ? (
              employees.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.emailId}</td>
                  <td>{employee.department}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="no-data">
                  {status === "loading" ? "Loading..." : "No employees found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewAllEmployees;