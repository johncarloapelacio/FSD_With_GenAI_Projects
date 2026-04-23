import axios from "axios";

// Root URL for the local JSON server API.
const API_BASE = "http://localhost:3000";

// Centralized endpoint catalog used across Redux async thunks.
export const API_ENDPOINTS = {
  CREDENTIALS: `${API_BASE}/credentials`,
  EMPLOYEES: `${API_BASE}/employeesInfo`,
  LEAVE: `${API_BASE}/leaveInfo`,
};

// Shared Axios client to keep request defaults in one place.
export const apiClient = axios.create({
  timeout: 10000,
});

// Normalizes API errors while preserving explicit backend messages when present.
export const getErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return fallbackMessage;
};
