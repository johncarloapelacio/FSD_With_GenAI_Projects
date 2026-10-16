import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, API_ENDPOINTS, getErrorMessage } from "../../config/api.js";

const initialState = {
  employees: [],
  status: "idle",
  error: "",
  requests: {},
};

export const fetchEmployees = createAsyncThunk(
  "employees/fetchEmployees",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.EMPLOYEES);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load employees."));
    }
  }
);

export const addEmployee = createAsyncThunk(
  "employees/addEmployee",
  async ({ email, department }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.EMPLOYEES, {
        emailId: email,
        department,
      });

      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to add employee. Please try again."));
    }
  }
);

export const verifyEmployeeEmail = createAsyncThunk(
  "employees/verifyEmployeeEmail",
  async ({ email, inviteCode }, { rejectWithValue }) => {
    try { return (await apiClient.post(`${API_ENDPOINTS.AUTH}/verify-invite`, { email, inviteCode })).data; }
    catch (error) { return rejectWithValue(getErrorMessage(error, "Invalid invitation")); }
  }
);
export const completeEmployeeSignup = createAsyncThunk("employees/completeEmployeeSignup", async (form, { rejectWithValue }) => {
  try { await apiClient.post(`${API_ENDPOINTS.AUTH}/signup`, form); return []; }
  catch (error) { return rejectWithValue(getErrorMessage(error, "Sign up failed")); }
});

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    clearEmployeesError: (state) => {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase("auth/sessionExpired", () => initialState)
      .addCase("auth/logoutUser/fulfilled", () => initialState)
      .addCase("auth/loginUser/fulfilled", () => initialState)
      .addCase(fetchEmployees.pending, (state, action) => {
        state.requests.fetchEmployees = action.meta.requestId;
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        if (state.requests.fetchEmployees !== action.meta.requestId) return;
        delete state.requests.fetchEmployees;
        state.status = "succeeded";
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        if (state.requests.fetchEmployees !== action.meta.requestId) return;
        delete state.requests.fetchEmployees;
        state.status = "failed";
        state.error = action.payload || "Failed to load employees.";
      })
      .addCase(addEmployee.pending, (state, action) => { state.requests.addEmployee = action.meta.requestId; })
      .addCase(addEmployee.fulfilled, (state, action) => {
        if (state.requests.addEmployee !== action.meta.requestId) return;
        delete state.requests.addEmployee;
        const { inviteCode, ...employee } = action.payload;
        void inviteCode;
        state.employees.push(employee);
        state.error = "";
      })
      .addCase(addEmployee.rejected, (state, action) => {
        if (state.requests.addEmployee !== action.meta.requestId) return;
        delete state.requests.addEmployee;
        state.error = action.payload || "Failed to add employee. Please try again.";
      })
      .addCase(verifyEmployeeEmail.pending, (state, action) => { state.requests.verifyEmployeeEmail = action.meta.requestId; })
      .addCase(verifyEmployeeEmail.fulfilled, (state, action) => {
        if (state.requests.verifyEmployeeEmail !== action.meta.requestId) return;
        delete state.requests.verifyEmployeeEmail;
        state.error = "";
      })
      .addCase(verifyEmployeeEmail.rejected, (state, action) => {
        if (state.requests.verifyEmployeeEmail !== action.meta.requestId) return;
        delete state.requests.verifyEmployeeEmail;
        state.error = action.payload || "Verification failed. Please try again.";
      })
      .addCase(completeEmployeeSignup.pending, (state, action) => { state.requests.completeEmployeeSignup = action.meta.requestId; })
      .addCase(completeEmployeeSignup.fulfilled, (state, action) => {
        if (state.requests.completeEmployeeSignup !== action.meta.requestId) return;
        delete state.requests.completeEmployeeSignup;
        state.employees = action.payload;
        state.error = "";
      })
      .addCase(completeEmployeeSignup.rejected, (state, action) => {
        if (state.requests.completeEmployeeSignup !== action.meta.requestId) return;
        delete state.requests.completeEmployeeSignup;
        state.error = action.payload || "Sign up failed. Please try again.";
      });
  },
});

export const { clearEmployeesError } = employeesSlice.actions;

export const selectEmployeesState = (state) => state.employees;
export const selectAllEmployees = (state) => state.employees.employees;
export const selectEmployeeByEmail = (state, email) =>
  state.employees.employees.find((emp) => emp.emailId === email) || null;

export default employeesSlice.reducer;
