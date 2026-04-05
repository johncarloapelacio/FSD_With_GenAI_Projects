import axios from "axios";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./ViewAllEmployees.css";

const ViewAllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data } = await axios.get(API_ENDPOINTS.EMPLOYEES);
      setEmployees(data);
    } catch (error) {
      console.error("Load employees error:", error);
    } finally {
      setLoading(false);
    }
  };

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
                  {loading ? "Loading..." : "No employees found"}
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