import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
let [emailId,setEmailId]=useState("");
let [password,setPassword]=useState("");
let [typeOfUser,setTypeOfUser]=useState("");
let [msg,setMsg]=useState("");

let LOGIN_URL="http://localhost:3000/logins";
let navigate = useNavigate();

let signIn = async(event)=> {
    setMsg("")
    event.preventDefault();

    if(emailId.length===0 || password.length===0){
        setMsg("All fields are required");
        return;
    }

    let login  = {emailId,password,typeOfUser};

    let loginDb = await axios.get(LOGIN_URL);

    let result = loginDb.data.find(ll =>
        ll.emailId===login.emailId &&
        ll.password===login.password &&
        ll.typeOfUser===login.typeOfUser
    );

    if(result===undefined){
        setMsg("Invalid EmailId / Password / User Type");
    } else {
        if(login.typeOfUser==="hr"){
            alert("HR Login successful");
            navigate("/hrHome");
        } else if(login.typeOfUser==="employee"){
            sessionStorage.setItem("emailId",login.emailId);
            alert("Employee login successful");
            navigate("/employeeHome");
        }
    }

    setEmailId("");
    setPassword("");
};

return(
    <div className="login-container">
        <div className="login-card">
            <h2 className="login-title">Login</h2>

            <form onSubmit={signIn} className="login-form">

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={emailId}
                        onChange={(e)=>setEmailId(e.target.value)}
                        placeholder="Enter email"
                    />
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
                    <label>User Type</label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                value="hr"
                                name="typeOfUser"
                                onChange={(e)=>setTypeOfUser(e.target.value)}
                            /> HR
                        </label>

                        <label>
                            <input
                                type="radio"
                                value="employee"
                                name="typeOfUser"
                                onChange={(e)=>setTypeOfUser(e.target.value)}
                            /> Employee
                        </label>
                    </div>
                </div>

                <button type="submit" className="login-btn">Sign In</button>

            </form>

            <p className="signup-text">
                Don't have an account? <Link to="signUp">Sign Up</Link>
            </p>

            {msg && <p className="error-msg">{msg}</p>}
        </div>
    </div>
);
}

export default Login;