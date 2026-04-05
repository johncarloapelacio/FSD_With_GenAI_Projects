import axios from "axios";
import { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./AddEmployee.css";

const AddEmployee = () => {
  const [form, setForm] = useState({ email: "", department: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email || !form.department) {
      setMessage("All fields are required");
      return;
    }

    try {
      const { data: employees } = await axios.get(API_ENDPOINTS.EMPLOYEES);
      const exists = employees.some(emp => emp.emailId === form.email);

      if (exists) {
        setMessage("Employee already exists");
        return;
      }

      await axios.post(API_ENDPOINTS.EMPLOYEES, {
        emailId: form.email,
        department: form.department,
      });
      setMessage("Employee added successfully");
      setForm({ email: "", department: "" });
    } catch (error) {
      setMessage("Failed to add employee. Please try again.");
      console.error("Add employee error:", error);
    }
  };

  return (
    <div className="add-employee-container">
      <div className="add-employee-card">
        <h2>Add Employee</h2>

        <form onSubmit={handleAddEmployee}>
          <div className="form-group">
            <label htmlFor="emp-email">Email</label>
            <input
              id="emp-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter employee email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="emp-department">Department</label>
            <input
              id="emp-department"
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Enter department"
            />
          </div>

          <button type="submit" className="submit-btn">
            Add Employee
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default AddEmployee;