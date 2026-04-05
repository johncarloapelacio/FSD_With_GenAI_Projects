import { Route, Routes } from "react-router-dom"
import Login from "./components/Login"
import SignUp from "./components/SignUp"
import HrDashboard from "./components/HrDashboard"
import EmployeeDashboard from "./components/EmployeeDashboard"
import AddEmployee from "./components/AddEmployee"
import ViewAllEmployees from "./components/ViewAllEmployees"
import EmployeeView from "./components/EmployeeView"
import ApplyLeave from "./components/ApplyLeave"
import ViewAllLeaveInfo from "./components/ViewAllLeaveInfo"
import ViewLeaveStatus from "./components/ViewLeaveStatus"

function App() {


  return (
    <>
      <h2>React Hr Portal App!</h2>  




      <Routes>
        <Route path="" element={<Login/>}/> 
        <Route path="signUp" element={<SignUp/>}/> 

        <Route path="hrHome" element={<HrDashboard/>}>
          <Route path="addEmployee" element={<AddEmployee/>}></Route>
          <Route path="viewEmployees" element={<ViewAllEmployees/>}></Route>
          <Route path="viewAllLeaveInfo" element={<ViewAllLeaveInfo/>}></Route>
        </Route>
 
        <Route path="employeeHome" element={<EmployeeDashboard/>}>
          <Route path="viewEmployee" element={<EmployeeView/>}></Route>
          <Route path="applyLeave" element={<ApplyLeave/>}></Route>
          <Route path="viewLeaveStatus" element={<ViewLeaveStatus/>}></Route>
        </Route>

      </Routes>  
    </>
  )
}

export default App
