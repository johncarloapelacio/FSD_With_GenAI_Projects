import axios from "axios";
import { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./ApplyLeave.css";

const ApplyLeave = () => {
  const [form, setForm] = useState({ reason: "", numberOfDays: "" });
  const [message, setMessage] = useState("");
  const email = sessionStorage.getItem("userEmail");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyLeave = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.reason || !form.numberOfDays) {
      setMessage("All fields are required");
      return;
    }

    try {
      await axios.post(API_ENDPOINTS.LEAVE, {
        emailId: email,
        reason: form.reason,
        numberOfDays: form.numberOfDays,
        status: "Pending",
      });
      setMessage("Leave applied successfully");
      setForm({ reason: "", numberOfDays: "" });
    } catch (error) {
      setMessage("Failed to apply leave. Please try again.");
      console.error("Apply leave error:", error);
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

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ApplyLeave;