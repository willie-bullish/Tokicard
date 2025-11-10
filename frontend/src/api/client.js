import { API_BASE_URL } from '../config.js';

async function parseError(response) {
  let message = 'Request failed';

  try {
    const data = await response.json();
    if (data?.message) {
      message = data.message;
    }
  } catch (error) {
    // ignore JSON parse errors
  }

  return message;
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const requestHeaders = { ...headers };

  if (body !== undefined && body !== null && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await parseError(response);

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

