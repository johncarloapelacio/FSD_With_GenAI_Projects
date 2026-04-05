import axios from "axios";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./ViewLeaveStatus.css";

const ViewLeaveStatus = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    loadLeaveStatus();
  }, []);

  const loadLeaveStatus = async () => {
    try {
      const email = sessionStorage.getItem("userEmail");
      if (!email) return;

      const { data } = await axios.get(API_ENDPOINTS.LEAVE);
      const userLeaves = data.filter(req => req.emailId === email);
      setLeaveRequests(userLeaves);
    } catch (error) {
      console.error("Load leave status error:", error);
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      "Approved": "status approved",
      "Denied": "status denied",
    };
    return statusClasses[status] || "status pending";
  };


  return (
    <div className="leave-status-container">
      <div className="leave-status-card">
        <h2>Your Leave Status</h2>

        <table className="leave-status-table">
          <thead>
            <tr>
              <th>Reason</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.reason}</td>
                  <td>{request.numberOfDays}</td>
                  <td>
                    <span className={getStatusClass(request.status)}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-data">
                  No leave records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewLeaveStatus;
