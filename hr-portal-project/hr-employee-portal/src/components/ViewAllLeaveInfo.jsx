import axios from "axios";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./ViewAllLeaveInfo.css";

const ViewAllLeaveInfo = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadLeaveRequests();
  }, [message]);

  const loadLeaveRequests = async () => {
    try {
      const { data } = await axios.get(API_ENDPOINTS.LEAVE);
      const pending = data.filter(req => req.status === "Pending");
      setLeaveRequests(pending);
    } catch (error) {
      console.error("Load leave requests error:", error);
    }
  };

  const handleChangeStatus = async (request, status) => {
    setMessage("");
    try {
      const updatedLeave = { ...request, status };
      await axios.patch(`${API_ENDPOINTS.LEAVE}/${request.id}`, updatedLeave);
      setMessage("Status updated successfully");
    } catch (error) {
      setMessage("Failed to update status. Please try again.");
      console.error("Change status error:", error);
    }
  };

  return (
    <div className="leave-table-container">
      <div className="leave-table-card">
        <h2>Pending Leave Requests</h2>

        <table className="leave-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Reason</th>
              <th>Days</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.emailId}</td>
                  <td>{request.reason}</td>
                  <td>{request.numberOfDays}</td>
                  <td>
                    <button
                      className="approve-btn"
                      onClick={() => handleChangeStatus(request, "Approved")}
                    >
                      Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => handleChangeStatus(request, "Denied")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  No pending leave requests
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ViewAllLeaveInfo;