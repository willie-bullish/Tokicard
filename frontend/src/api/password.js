import { apiRequest } from './client.js';

export async function requestPasswordReset(email) {
  if (!email) {
    throw new Error('Email is required');
  }

  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export async function submitPasswordReset({ email, token, resetId, password }) {
  if (!email || !token || !resetId || !password) {
    throw new Error('Missing required fields');
  }

  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { email, token, resetId, password },
    auth: false,
  });
}

