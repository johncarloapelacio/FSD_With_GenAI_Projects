import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectLoggedInEmail } from "../store/slices/authSlice";
import {
  fetchLeaveRequests,
  selectLeaveByEmail,
  selectLeaveState,
} from "../store/slices/leaveSlice";
import "./ViewLeaveStatus.css";

const ViewLeaveStatus = () => {
  // Derives logged-in employee leave history from Redux state.
  const dispatch = useDispatch();
  const email = useSelector(selectLoggedInEmail);
  const { status } = useSelector(selectLeaveState);
  const leaveRequests = useSelector((state) => selectLeaveByEmail(state, email));

  // Fetches leave data once so status table has current records.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchLeaveRequests());
    }
  }, [dispatch, status]);

  // Maps domain status values to corresponding CSS classes.
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
                <tr key={request.id} className="leave-status-row">
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
                  {status === "loading" ? "Loading..." : "No leave records found"}
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
