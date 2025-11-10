import { apiRequest } from './client.js';

export function fetchReferrals(page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  return apiRequest(`/auth/referrals?${params.toString()}`, { auth: true });
}

