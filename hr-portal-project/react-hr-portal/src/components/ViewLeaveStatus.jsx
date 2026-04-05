import axios from "axios";
import { useEffect, useState } from "react";
import "./ViewLeaveStatus.css";

function ViewLeaveStatus() {

let [leaveInfo,setLeaveInfo]=useState([]);

let LEAVE_INFO_URL = "http://localhost:3000/leaveInformation";
let emailId = sessionStorage.getItem("emailId");

useEffect(()=> {
    viewLeaveInfo();
},[]);

let viewLeaveInfo = async()=> {
    let allLeaveInfo = await axios.get(LEAVE_INFO_URL);

    let leaveStatus = allLeaveInfo.data.filter(
        ll => ll.emailId === emailId
    );

    setLeaveInfo(leaveStatus);
}

/* Status Badge Class */
let getStatusClass = (status) => {
    if(status === "Approved") return "status approved";
    if(status === "Denied") return "status denied";
    return "status pending";
}

return(
    <div className="leave-status-container">

        <div className="leave-status-card">
            <h2>Your Leave Status</h2>

            <table className="leave-status-table">

                <thead>
                    <tr>
                        <th>Reason</th>
                        <th>Days</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {leaveInfo.length > 0 ? (
                        leaveInfo.map(ll => (
                            <tr key={ll.id}>
                                <td>{ll.reason}</td>
                                <td>{ll.numberOfDays}</td>
                                <td>
                                    <span className={getStatusClass(ll.status)}>
                                        {ll.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="no-data">
                                No leave records found
                            </td>
                        </tr>
                    )}
                </tbody>

            </table>

        </div>

    </div>
)
}

export default ViewLeaveStatus;