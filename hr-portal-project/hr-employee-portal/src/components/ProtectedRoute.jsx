import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectIsEmployee,
  selectIsHR,
} from "../store/slices/authSlice";

const ProtectedRoute = ({ requiredUserType }) => {
  // Read auth and role flags from Redux to evaluate route access.
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isHR = useSelector(selectIsHR);
  const isEmployee = useSelector(selectIsEmployee);

  // Block unauthenticated access to any protected route.
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Enforce HR-only route constraints.
  if (requiredUserType === "hr" && !isHR) {
    return <Navigate to="/employeeHome" replace />;
  }

  // Enforce employee-only route constraints.
  if (requiredUserType === "employee" && !isEmployee) {
    return <Navigate to="/hrHome" replace />;
  }

  // Render nested route when access rules pass.
  return <Outlet />;
};

export default ProtectedRoute;
