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
  const dispatch = useDispatch();
  const email = useSelector(selectLoggedInEmail);
  const { status, error } = useSelector(selectLeaveState);
  const leaveRequests = useSelector((state) => selectLeaveByEmail(state, email));

  useEffect(() => {
    dispatch(fetchLeaveRequests());
  }, [dispatch]);

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
        {error && <p role="alert">{error}</p>}

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
