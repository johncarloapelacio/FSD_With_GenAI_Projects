import axios from "axios";
import { useState } from "react";
import "./AddEmployee.css";

function AddEmployee() {

let [emailId,setEmailId]=useState("");
let [department,setDepartment]=useState("");
let [msg,setMsg]=useState("");

let EMPLOYEE_URL="http://localhost:3000/employees";

let addEmployee = async(event)=> {
    event.preventDefault();
    setMsg("");

    if(emailId==="" || department===""){
        setMsg("All fields are required");
        return;
    }

    let newEmployee = {emailId,department};

    let allEmployees = await axios.get(EMPLOYEE_URL);

    let employeePresent = allEmployees.data.find(
        employee => employee.emailId === newEmployee.emailId
    );

    if(employeePresent===undefined){
        await axios.post(EMPLOYEE_URL,newEmployee);
        setMsg("Employee added successfully ✅");
    } else {
        setMsg("Employee already exists ❌");
    }

    setEmailId("");
    setDepartment("");
}

return(
    <div className="add-employee-container">

        <div className="add-employee-card">
            <h2>Add Employee</h2>

            <form onSubmit={addEmployee}>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={emailId}
                        onChange={(e)=>setEmailId(e.target.value)}
                        placeholder="Enter employee email"
                    />
                </div>

                <div className="form-group">
                    <label>Department</label>
                    <input
                        type="text"
                        value={department}
                        onChange={(e)=>setDepartment(e.target.value)}
                        placeholder="Enter department"
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Add Employee
                </button>

            </form>

            {msg && <p className="message">{msg}</p>}
        </div>

    </div>
)
}

export default AddEmployee;