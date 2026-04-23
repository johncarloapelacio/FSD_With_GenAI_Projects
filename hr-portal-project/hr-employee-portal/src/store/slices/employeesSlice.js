import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, API_ENDPOINTS, getErrorMessage } from "../../config/api";

// Employees domain state used by HR and Employee views.
const initialState = {
  employees: [],
  status: "idle",
  error: "",
};

// Loads employee records for tables, profile pages, and greeting data.
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

// Creates a new employee record after duplicate email validation.
export const addEmployee = createAsyncThunk(
  "employees/addEmployee",
  async ({ email, department }, { getState, rejectWithValue }) => {
    try {
      const currentEmployees = getState().employees.employees;
      const hasLocalData = currentEmployees.length > 0;
      const employees = hasLocalData
        ? currentEmployees
        : (await apiClient.get(API_ENDPOINTS.EMPLOYEES)).data;

      const exists = employees.some((emp) => emp.emailId === email);
      if (exists) {
        return rejectWithValue("Employee already exists");
      }

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

// Validates whether an employee can continue through the signup flow.
export const verifyEmployeeEmail = createAsyncThunk(
  "employees/verifyEmployeeEmail",
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.EMPLOYEES);
      const employee = data.find((emp) => emp.emailId === email);

      if (!employee) {
        return rejectWithValue("You are not part of the organization");
      }

      if (employee.signedUp) {
        return rejectWithValue("You are already signed up");
      }

      return {
        employeeId: employee.id,
        department: employee.department,
        email: employee.emailId,
        employees: data,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Verification failed. Please try again."));
    }
  }
);

// Completes employee signup and synchronizes both employee and credential data.
export const completeEmployeeSignup = createAsyncThunk(
  "employees/completeEmployeeSignup",
  async ({ employeeId, firstName, lastName, email, password, department, age }, { rejectWithValue }) => {
    try {
      const employeeData = {
        fname: firstName,
        lname: lastName,
        emailId: email,
        password,
        department,
        age,
        signedUp: true,
      };

      const loginData = {
        emailId: email,
        password,
        typeOfUser: "employee",
      };

      await apiClient.patch(`${API_ENDPOINTS.EMPLOYEES}/${employeeId}`, employeeData);
      await apiClient.post(API_ENDPOINTS.CREDENTIALS, loginData);
      const { data } = await apiClient.get(API_ENDPOINTS.EMPLOYEES);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Sign up failed. Please try again."));
    }
  }
);

// Employees slice reducers coordinate async status and entity updates.
const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    clearEmployeesError: (state) => {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // Handles all thunk lifecycle events for employee operations.
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load employees.";
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
        state.error = "";
      })
      .addCase(addEmployee.rejected, (state, action) => {
        state.error = action.payload || "Failed to add employee. Please try again.";
      })
      .addCase(verifyEmployeeEmail.fulfilled, (state, action) => {
        state.employees = action.payload.employees;
        state.error = "";
      })
      .addCase(verifyEmployeeEmail.rejected, (state, action) => {
        state.error = action.payload || "Verification failed. Please try again.";
      })
      .addCase(completeEmployeeSignup.fulfilled, (state, action) => {
        state.employees = action.payload;
        state.error = "";
      })
      .addCase(completeEmployeeSignup.rejected, (state, action) => {
        state.error = action.payload || "Sign up failed. Please try again.";
      });
  },
});

export const { clearEmployeesError } = employeesSlice.actions;

// Employees selectors provide reusable lookups for list and profile screens.
export const selectEmployeesState = (state) => state.employees;
export const selectAllEmployees = (state) => state.employees.employees;
export const selectEmployeeByEmail = (state, email) =>
  state.employees.employees.find((emp) => emp.emailId === email) || null;

export default employeesSlice.reducer;
