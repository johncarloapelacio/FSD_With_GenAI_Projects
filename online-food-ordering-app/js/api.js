'use strict';
window.foodApi = async function foodApi(url, options = {}) {
  const { expectedAccountId, ...requestOptions } = options;
  const settings = { ...requestOptions, credentials: 'same-origin', headers: { ...(options.headers || {}) } };
  if (expectedAccountId !== undefined && expectedAccountId !== null) settings.headers['X-Food-Account-Id'] = expectedAccountId;
  if (settings.body !== undefined) {
    settings.headers['Content-Type'] = 'application/json';
    settings.body = JSON.stringify(settings.body);
  }
  let response;
  try { response = await fetch(url, settings); }
  catch { throw new Error('Unable to connect. Please check your connection and retry.'); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || `Request failed (${response.status}).`);
    error.status = response.status;
    if (typeof result.code === 'string') error.code = result.code;
    throw error;
  }
  return result;
};
