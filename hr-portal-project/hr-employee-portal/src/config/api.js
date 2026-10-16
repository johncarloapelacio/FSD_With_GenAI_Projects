import axios from "axios";
const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export const API_ENDPOINTS = { AUTH: `${API_BASE}/auth`, EMPLOYEES: `${API_BASE}/employeesInfo`, LEAVE: `${API_BASE}/leaveInfo` };
export const apiClient = axios.create({ timeout: 10000, withCredentials: true, headers: { "X-Requested-With": "portfolio-app" } });
let accountContext = () => '';
export const configureAccountContext = getter => { accountContext = getter; };
apiClient.interceptors.request.use(config => {
  const account = accountContext();
  if (account) config.headers['X-Expected-Account'] = account;
  return config;
});
export const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

apiClient.interceptors.response.use(response => response, error => {
  if ((error.response?.status === 401 || error.response?.data?.code === "ACCOUNT_CHANGED") && typeof window !== "undefined") window.dispatchEvent(new Event("auth-expired"));
  return Promise.reject(error);
});
