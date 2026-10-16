import { configureAccountContext } from "../config/api";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import employeesReducer from "./slices/employeesSlice";
import leaveReducer from "./slices/leaveSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeesReducer,
    leave: leaveReducer,
  },
});

configureAccountContext(() => store.getState().auth.id);
