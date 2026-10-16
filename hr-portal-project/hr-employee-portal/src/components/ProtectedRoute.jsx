import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectAuth,
  selectIsAuthenticated,
  selectIsEmployee,
  selectIsHR,
} from "../store/slices/authSlice";

const ProtectedRoute = ({ requiredUserType }) => {
  const { checked } = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isHR = useSelector(selectIsHR);
  const isEmployee = useSelector(selectIsEmployee);

  if (!checked) return <p role="status">Checking session...</p>;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredUserType === "hr" && !isHR) {
    return <Navigate to="/employeeHome" replace />;
  }

  if (requiredUserType === "employee" && !isEmployee) {
    return <Navigate to="/hrHome" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
