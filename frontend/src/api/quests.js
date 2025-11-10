import { apiRequest } from './client.js';

export function fetchQuests() {
  return apiRequest('/quests', { method: 'GET', auth: true });
}

export function completeQuest(slug) {
  return apiRequest(`/quests/${slug}/complete`, {
    method: 'POST',
    auth: true,
  });
}

