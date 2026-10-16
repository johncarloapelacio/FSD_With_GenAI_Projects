import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, API_ENDPOINTS, getErrorMessage } from "../../config/api.js";
const initialState = { id: "", userEmail: "", userType: "", status: "idle", error: "", checked: false };
export const loginUser = createAsyncThunk("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try { return (await apiClient.post(`${API_ENDPOINTS.AUTH}/login`, credentials)).data; }
  catch (e) { return rejectWithValue(getErrorMessage(e, "Login failed")); }
});
export const fetchSession = createAsyncThunk("auth/fetchSession", async () => (await apiClient.get(`${API_ENDPOINTS.AUTH}/session`)).data);
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  try { await apiClient.post(`${API_ENDPOINTS.AUTH}/logout`); }
  catch (error) { if (error.response?.status !== 401) throw error; }
});
const authSlice = createSlice({ name: "auth", initialState, reducers: { clearAuthError: state => { state.error = ""; }, sessionExpired: state => { Object.assign(state, initialState, { checked: true }); } }, extraReducers: builder => {
  builder.addCase(loginUser.pending, state => { state.status = "loading"; state.error = ""; })
    .addCase(loginUser.fulfilled, (state, action) => { Object.assign(state, action.payload, { checked: true, status: "succeeded", error: "" }); })
    .addCase(loginUser.rejected, (state, action) => { state.status = "failed"; state.error = action.payload; })
    .addCase(fetchSession.fulfilled, (state, action) => { if (!state.checked) Object.assign(state, action.payload, { checked: true }); })
    .addCase(fetchSession.rejected, state => { if (!state.checked) Object.assign(state, initialState, { checked: true }); })
    .addCase(logoutUser.fulfilled, state => { Object.assign(state, initialState, { checked: true }); });
} });
export const { clearAuthError, sessionExpired } = authSlice.actions;
export const selectAuth = state => state.auth;
export const selectIsAuthenticated = state => Boolean(state.auth.userType);
export const selectIsHR = state => state.auth.userType === "hr";
export const selectIsEmployee = state => state.auth.userType === "employee";
export const selectLoggedInEmail = state => state.auth.userEmail;
export default authSlice.reducer;
