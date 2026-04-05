import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./SignUp.css";

function SignUp() {

let [emailId,setEmailId]=useState("");
let [department,setDepartment]=useState("");
let [age,setAge]=useState("");
let [password,setPassword]=useState("");
let [id,setId]=useState("");
let [flag,setFlag]=useState(true);
let [msg,setMsg]=useState("");

let EMPLOYEE_URL="http://localhost:3000/employees";
let LOGIN_URL="http://localhost:3000/logins";

/* Step 1: Verify Email */
let verifyEmailId = async(event)=> {
    event.preventDefault();
    setMsg("");

    let employees = await axios.get(EMPLOYEE_URL);

    let employeePresent = employees.data.find(
        employee => employee.emailId === emailId
    );

    if(employeePresent===undefined){
        setMsg("❌ You are not part of the organization");
        setEmailId("");
    } else {
        setFlag(false);
        setId(employeePresent.id);
        setDepartment(employeePresent.department);
        setEmailId(employeePresent.emailId);
    }
}

/* Step 2: Complete Signup */
let signUp = async (event)=> {
    event.preventDefault();
    setMsg("");

    if(password==="" || age===""){
        setMsg("All fields are required ❌");
        return;
    }

    let existingEmployee = {emailId,password,department,age};
    let loginDetails = {emailId,password,typeOfUser:"employee"};

    await axios.patch(EMPLOYEE_URL+"/"+id,existingEmployee);
    await axios.post(LOGIN_URL,loginDetails);

    setMsg("✅ Sign Up Successful");

    setFlag(true);
    setEmailId("");
    setDepartment("");
    setPassword("");
    setAge("");
}

return(
    <div className="signup-container">

        <div className="signup-card">
            <h2>Employee Sign Up</h2>

            {flag ? (
                /* STEP 1 */
                <form onSubmit={verifyEmailId}>

                    <div className="form-group">
                        <label>Registered Email</label>
                        <input
                            type="email"
                            value={emailId}
                            onChange={(e)=>setEmailId(e.target.value)}
                            placeholder="Enter your company email"
                        />
                    </div>

                    <button className="signup-btn">
                        Verify Email
                    </button>

                </form>
            ) : (
                /* STEP 2 */
                <form onSubmit={signUp}>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={emailId} readOnly />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <input type="text" value={department} readOnly />
                    </div>

                    <div className="form-group">
                        <label>Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e)=>setAge(e.target.value)}
                            placeholder="Enter age"
                        />
                    </div>

                    <button className="signup-btn">
                        Complete Sign Up
                    </button>

                </form>
            )}

            {msg && <p className="message">{msg}</p>}

            <p className="signin-link">
                Already have an account? <Link to="/">Sign In</Link>
            </p>

        </div>
    </div>
)
}

export default SignUp;