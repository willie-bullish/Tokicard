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

async function adminRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const requestHeaders = { ...headers };

  if (body !== undefined && body !== null && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('adminToken');
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('adminToken');
      window.location.href = '/admin';
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

export async function adminLogin(username, password) {
  const data = await adminRequest('/admin/login', {
    method: 'POST',
    body: { username, password },
  });
  if (data.token) {
    localStorage.setItem('adminToken', data.token);
  }
  return data;
}

export async function getAdminAnalytics() {
  return adminRequest('/admin/analytics');
}

export async function getAdminQuests() {
  return adminRequest('/admin/quests');
}

export async function createQuest(quest) {
  return adminRequest('/admin/quests', {
    method: 'POST',
    body: quest,
  });
}

export async function updateQuest(id, updates) {
  return adminRequest(`/admin/quests/${id}`, {
    method: 'PUT',
    body: updates,
  });
}

export async function deleteQuest(id) {
  return adminRequest(`/admin/quests/${id}`, {
    method: 'DELETE',
  });
}

