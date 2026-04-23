import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import employeesReducer from "./slices/employeesSlice";
import leaveReducer from "./slices/leaveSlice";

// Root Redux store: each domain slice is registered under its feature key.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeesReducer,
    leave: leaveReducer,
  },
});
