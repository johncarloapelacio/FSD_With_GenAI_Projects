import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, API_ENDPOINTS, getErrorMessage } from "../../config/api";

// Leave domain state stores all leave requests and request lifecycle status.
const initialState = {
  leaveRequests: [],
  status: "idle",
  error: "",
};

// Retrieves all leave requests for both HR and employee perspectives.
export const fetchLeaveRequests = createAsyncThunk(
  "leave/fetchLeaveRequests",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.LEAVE);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load leave requests."));
    }
  }
);

// Creates a new leave request with default pending status.
export const applyLeaveRequest = createAsyncThunk(
  "leave/applyLeaveRequest",
  async ({ email, reason, numberOfDays }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.LEAVE, {
        emailId: email,
        reason,
        numberOfDays,
        status: "Pending",
      });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to apply leave. Please try again."));
    }
  }
);

// Updates the status of an existing leave request (approve/deny workflow).
export const updateLeaveStatus = createAsyncThunk(
  "leave/updateLeaveStatus",
  async ({ request, status }, { rejectWithValue }) => {
    try {
      const updatedLeave = { ...request, status };
      const { data } = await apiClient.patch(`${API_ENDPOINTS.LEAVE}/${request.id}`, updatedLeave);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to update status. Please try again."));
    }
  }
);

// Leave slice reducers handle status transitions and request state mutations.
const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    clearLeaveError: (state) => {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // Handles all thunk lifecycle events for leave operations.
    builder
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.leaveRequests = action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load leave requests.";
      })
      .addCase(applyLeaveRequest.fulfilled, (state, action) => {
        state.leaveRequests.push(action.payload);
        state.error = "";
      })
      .addCase(applyLeaveRequest.rejected, (state, action) => {
        state.error = action.payload || "Failed to apply leave. Please try again.";
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.leaveRequests = state.leaveRequests.map((request) =>
          request.id === action.payload.id ? action.payload : request
        );
        state.error = "";
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.error = action.payload || "Failed to update status. Please try again.";
      });
  },
});

export const { clearLeaveError } = leaveSlice.actions;

// Leave selectors expose filtered and raw leave data to consuming components.
export const selectLeaveState = (state) => state.leave;
export const selectAllLeaveRequests = (state) => state.leave.leaveRequests;
export const selectPendingLeaveRequests = (state) =>
  state.leave.leaveRequests.filter((request) => request.status === "Pending");
export const selectLeaveByEmail = (state, email) =>
  state.leave.leaveRequests.filter((request) => request.emailId === email);

export default leaveSlice.reducer;
