import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import { apiClient } from '../config/api.js';
import auth, { loginUser, logoutUser } from './slices/authSlice.js';
import employees, { completeEmployeeSignup, verifyEmployeeEmail, fetchEmployees } from './slices/employeesSlice.js';
import leave, { updateLeaveStatus, fetchLeaveRequests } from './slices/leaveSlice.js';
test('login and signup use dedicated server endpoints; invite verification never downloads the directory', async () => {
  const store = configureStore({ reducer: { auth, employees, leave } });
  const calls = [];
  const originalPost = apiClient.post;
  apiClient.post = async (url, body) => { calls.push({ url, body }); return { data: url.endsWith('/login') ? { userEmail: 'me@example.test', userType: 'employee' } : {} }; };
  try {
    await store.dispatch(loginUser({ email: 'me@example.test', password: 'Secret12345', userType: 'employee' })).unwrap();
    assert.equal(calls[0].url, '/api/auth/login');
    await store.dispatch(verifyEmployeeEmail({ email: 'me@example.test', inviteCode: 'private-invite' })).unwrap();
    assert.deepEqual(calls[1], { url: '/api/auth/verify-invite', body: { email: 'me@example.test', inviteCode: 'private-invite' } });
    await store.dispatch(completeEmployeeSignup({ email: 'me@example.test', password: 'Secret12345', inviteCode: 'private-invite' })).unwrap();
    assert.equal(calls[2].url, '/api/auth/signup');
    await store.dispatch(logoutUser()).unwrap();
    assert.equal(store.getState().auth.userType, '');
    assert.equal(store.getState().employees.employees.length, 0);
  } finally { apiClient.post = originalPost; }
});
test('leave decision sends only the decision, preserving immutable request details', async () => {
  const original = apiClient.patch;
  let sent;
  apiClient.patch = async (url, body) => { sent = { url, body }; return { data: { id: 'leave-1', status: 'Approved' } }; };
  try {
    const store = configureStore({ reducer: { leave } });
    await store.dispatch(updateLeaveStatus({ request: { id: 'leave-1', emailId: 'sensitive@example.test', reason: 'Private reason' }, status: 'Approved' })).unwrap();
    assert.deepEqual(sent, { url: '/api/leaveInfo/leave-1', body: { status: 'Approved' } });
  } finally { apiClient.patch = original; }
});

test('late private responses cannot restore an old account cache after logout or account change', async () => {
  const store = configureStore({ reducer: { auth, employees, leave } });
  const originalGet = apiClient.get;
  const waiting = [];
  apiClient.get = () => new Promise(resolve => waiting.push(resolve));
  try {
    const employeesRequest = store.dispatch(fetchEmployees());
    const leaveRequest = store.dispatch(fetchLeaveRequests());
    store.dispatch({ type: "auth/sessionExpired" });
    waiting[0]({ data: [{ id: 'old-private-employee', emailId: 'previous@example.test' }] });
    waiting[1]({ data: [{ id: 'old-private-leave', emailId: 'previous@example.test' }] });
    await Promise.all([employeesRequest, leaveRequest]);
    assert.deepEqual(store.getState().employees.employees, []);
    assert.deepEqual(store.getState().leave.leaveRequests, []);
  } finally { apiClient.get = originalGet; }
});
