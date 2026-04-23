import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, API_ENDPOINTS, getErrorMessage } from "../../config/api";

// Session storage keys used to persist logged-in user context across refreshes.
const STORAGE_EMAIL_KEY = "userEmail";
const STORAGE_TYPE_KEY = "userType";

// Auth slice state, initialized from session storage when available.
const initialState = {
  userEmail: sessionStorage.getItem(STORAGE_EMAIL_KEY) || "",
  userType: sessionStorage.getItem(STORAGE_TYPE_KEY) || "",
  status: "idle",
  error: "",
};

// Authenticates a user by validating credentials and role against API records.
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password, userType }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CREDENTIALS);
      const user = data.find(
        (record) =>
          record.emailId === email &&
          record.password === password &&
          record.typeOfUser === userType
      );

      if (!user) {
        return rejectWithValue("Invalid Email / Password / User Type");
      }

      return {
        userEmail: email,
        userType,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Login failed. Please try again."));
    }
  }
);

// Auth slice reducers manage auth lifecycle and persistence state.
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = "";
    },
    logoutUser: (state) => {
      state.userEmail = "";
      state.userType = "";
      state.status = "idle";
      state.error = "";
      sessionStorage.removeItem(STORAGE_EMAIL_KEY);
      sessionStorage.removeItem(STORAGE_TYPE_KEY);
    },
  },
  extraReducers: (builder) => {
    // Async auth status transitions for login request lifecycle.
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userEmail = action.payload.userEmail;
        state.userType = action.payload.userType;
        state.error = "";
        sessionStorage.setItem(STORAGE_EMAIL_KEY, action.payload.userEmail);
        sessionStorage.setItem(STORAGE_TYPE_KEY, action.payload.userType);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed. Please try again.";
      });
  },
});

export const { clearAuthError, logoutUser } = authSlice.actions;

// Auth selectors expose derived role/login information for components and guards.
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => Boolean(state.auth.userType);
export const selectIsHR = (state) => state.auth.userType === "hr";
export const selectIsEmployee = (state) => state.auth.userType === "employee";
export const selectLoggedInEmail = (state) => state.auth.userEmail;

export default authSlice.reducer;
