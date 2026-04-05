import axios from "axios";
import { useEffect, useState } from "react";
import "./EmployeeView.css";

function EmployeeView() {

let [employee,setEmployee]=useState({});
let EMPLOYEE_URL="http://localhost:3000/employees";

useEffect(()=> {
    viewEmployees();
},[]);

let viewEmployees = async()=> {   
    let allEmployees = await axios.get(EMPLOYEE_URL);
    let emailId = sessionStorage.getItem("emailId");

    let employeeInfo = allEmployees.data.find(
        employee => employee.emailId === emailId
    );

    setEmployee(employeeInfo || {});
}

return(
    <div className="profile-container">

        <div className="profile-card">
            <h2>Your Profile</h2>

            <div className="profile-row">
                <span>Email</span>
                <span>{employee.emailId || "-"}</span>
            </div>

            <div className="profile-row">
                <span>Age</span>
                <span>{employee.age || "-"}</span>
            </div>

            <div className="profile-row">
                <span>Department</span>
                <span>{employee.department || "-"}</span>
            </div>

        </div>

    </div>
)
}

export default EmployeeView;