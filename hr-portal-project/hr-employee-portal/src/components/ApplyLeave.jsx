import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectLoggedInEmail } from "../store/slices/authSlice";
import { applyLeaveRequest } from "../store/slices/leaveSlice";
import "./ApplyLeave.css";

const ApplyLeave = () => {
  // Local leave form state with Redux-authenticated user context.
  const dispatch = useDispatch();
  const [form, setForm] = useState({ reason: "", numberOfDays: "" });
  const [message, setMessage] = useState("");
  const email = useSelector(selectLoggedInEmail);

  // Generic input handler for leave form fields.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Validates form and submits leave request through Redux thunk.
  const handleApplyLeave = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.reason || !form.numberOfDays) {
      setMessage("All fields are required");
      return;
    }

    try {
      await dispatch(
        applyLeaveRequest({
          email,
          reason: form.reason,
          numberOfDays: form.numberOfDays,
        })
      ).unwrap();
      setMessage("Leave applied successfully");
      setForm({ reason: "", numberOfDays: "" });
    } catch (errorMessage) {
      setMessage(errorMessage || "Failed to apply leave. Please try again.");
    }
  };

  return (
    <div className="leave-container">
      <div className="leave-card">
        <h2>Apply Leave</h2>

        <form onSubmit={handleApplyLeave}>
          <div className="form-group">
            <label htmlFor="leave-reason">Reason</label>
            <input
              id="leave-reason"
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Enter reason for leave"
            />
          </div>

          <div className="form-group">
            <label htmlFor="leave-days">Number of Days</label>
            <input
              id="leave-days"
              type="number"
              name="numberOfDays"
              value={form.numberOfDays}
              onChange={handleChange}
              placeholder="Enter number of days"
            />
          </div>

          <button type="submit" className="apply-btn">
            Apply Leave
          </button>
        </form>

        {message && <p className="app-message">{message}</p>}
      </div>
    </div>
  );
};

export default ApplyLeave;