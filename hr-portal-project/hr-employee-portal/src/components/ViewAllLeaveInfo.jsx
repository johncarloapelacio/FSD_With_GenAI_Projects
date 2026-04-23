import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLeaveRequests,
  selectLeaveState,
  selectPendingLeaveRequests,
  updateLeaveStatus,
} from "../store/slices/leaveSlice";
import "./ViewAllLeaveInfo.css";

const ViewAllLeaveInfo = () => {
  // Loads pending requests and mutation status from Redux leave domain.
  const dispatch = useDispatch();
  const leaveRequests = useSelector(selectPendingLeaveRequests);
  const { status } = useSelector(selectLeaveState);
  const [message, setMessage] = useState("");

  // Fetches leave requests once for the HR review table.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchLeaveRequests());
    }
  }, [dispatch, status]);

  // Updates a leave request status and refreshes UI through Redux state updates.
  const handleChangeStatus = async (request, status) => {
    setMessage("");
    try {
      await dispatch(updateLeaveStatus({ request, status })).unwrap();
      setMessage("Status updated successfully");
    } catch (errorMessage) {
      setMessage(errorMessage || "Failed to update status. Please try again.");
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
                  {status === "loading" ? "Loading..." : "No pending leave requests"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {message && <p className="app-message">{message}</p>}
      </div>
    </div>
  );
};

export default ViewAllLeaveInfo;