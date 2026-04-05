import axios from "axios";
import { useState } from "react";
import "./ApplyLeave.css";

function ApplyLeave() {

let [reason,setReason]=useState("");
let [numberOfDays,setNumberOfDays]=useState("");
let [status,setStatus]=useState("Pending");
let [msg,setMessage]=useState("");

let LEAVE_INFO_URL = "http://localhost:3000/leaveInformation";
let emailId = sessionStorage.getItem("emailId");

let applyLeaveDetails = async(event)=> {
    event.preventDefault();
    setMessage("");

    if(reason==="" || numberOfDays===""){
        setMessage("All fields are required ❌");
        return;
    }

    let newLeaveInfo  = {emailId,reason,numberOfDays,status};

    await axios.post(LEAVE_INFO_URL,newLeaveInfo);

    setMessage("Leave applied successfully ✅");

    setReason("");
    setNumberOfDays("");
}

return(
    <div className="leave-container">

        <div className="leave-card">
            <h2>Apply Leave</h2>

            <form onSubmit={applyLeaveDetails}>

                <div className="form-group">
                    <label>Reason</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e)=>setReason(e.target.value)}
                        placeholder="Enter reason for leave"
                    />
                </div>

                <div className="form-group">
                    <label>Number of Days</label>
                    <input
                        type="number"
                        value={numberOfDays}
                        onChange={(e)=>setNumberOfDays(e.target.value)}
                        placeholder="Enter number of days"
                    />
                </div>

                <button type="submit" className="apply-btn">
                    Apply Leave
                </button>

            </form>

            {msg && <p className="message">{msg}</p>}
        </div>

    </div>
)
}

export default ApplyLeave;