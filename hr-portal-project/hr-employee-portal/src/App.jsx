import { Route, Routes } from "react-router-dom"
import Login from "./components/Login"
import SignUp from "./components/SignUp"
import HRDashboard from "./components/HRDashboard"
import EmployeeDashboard from "./components/EmployeeDashboard"
import AddEmployee from "./components/AddEmployee"
import ViewAllEmployees from "./components/ViewAllEmployees"
import EmployeeView from "./components/EmployeeView"
import ApplyLeave from "./components/ApplyLeave"
import ViewAllLeaveInfo from "./components/ViewAllLeaveInfo"
import ViewLeaveStatus from "./components/ViewLeaveStatus"
import ProtectedRoute from "./components/ProtectedRoute"
import HRWelcome from "./components/HRWelcome"
import EmployeeWelcome from "./components/EmployeeWelcome"

function App() {
  return (
    // Top-level route map for public and protected application areas.
    <Routes>
        {/* Public routes: authentication and account onboarding. */}
        <Route path="/" element={<Login/>}/> 
        <Route path="/signUp" element={<SignUp/>}/> 

        {/* HR-only route tree guarded by role-based protection. */}
        <Route element={<ProtectedRoute requiredUserType="hr" />}>
          <Route path="/hrHome" element={<HRDashboard/>}>
            {/* Index route shows welcome message when no sub-route is active. */}
            <Route index element={<HRWelcome/>} />
            <Route path="addEmployee" element={<AddEmployee/>}></Route>
            <Route path="viewEmployees" element={<ViewAllEmployees/>}></Route>
            <Route path="viewAllLeaveInfo" element={<ViewAllLeaveInfo/>}></Route>
          </Route>
        </Route>
 
        {/* Employee-only route tree guarded by role-based protection. */}
        <Route element={<ProtectedRoute requiredUserType="employee" />}>
          <Route path="/employeeHome" element={<EmployeeDashboard/>}>
            {/* Index route shows welcome message when no sub-route is active. */}
            <Route index element={<EmployeeWelcome/>} />
            <Route path="viewEmployee" element={<EmployeeView/>}></Route>
            <Route path="applyLeave" element={<ApplyLeave/>}></Route>
            <Route path="viewLeaveStatus" element={<ViewLeaveStatus/>}></Route>
          </Route>
        </Route>

      </Routes>
    )
  }

export default App
