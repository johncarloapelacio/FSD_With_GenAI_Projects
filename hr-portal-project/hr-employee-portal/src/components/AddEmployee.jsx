import { useState } from "react";
import { useDispatch } from "react-redux";
import { addEmployee } from "../store/slices/employeesSlice";
import "./AddEmployee.css";

const AddEmployee = () => {
  // Local form and message state for employee creation workflow.
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", department: "" });
  const [message, setMessage] = useState("");

  // Shared input handler for employee add form fields.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Validates input and submits employee creation via Redux thunk.
  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email || !form.department) {
      setMessage("All fields are required");
      return;
    }

    try {
      await dispatch(addEmployee(form)).unwrap();
      setMessage("Employee added successfully");
      setForm({ email: "", department: "" });
    } catch (errorMessage) {
      setMessage(errorMessage || "Failed to add employee. Please try again.");
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

        {message && <p className="app-message">{message}</p>}
      </div>
    </div>
  );
};

export default AddEmployee;