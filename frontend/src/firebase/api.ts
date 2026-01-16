import { ensureAuth } from './auth';
import { API_ENDPOINTS } from './config';

const API_URL = API_ENDPOINTS.gameSessions;

async function callApi(path: string, body?: unknown) {
  const user = await ensureAuth();
  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const api = {
  createGameSession: (questionnaireId: string, userId: string) =>
    callApi('/gameSessions', { questionnaireId, userId }),

  joinSession: (sessionId: string, userId: string) =>
    callApi(`/gameSessions/${sessionId}/join`, { userId }),

  validateAnswer: (sessionId: string, userId: string, answer: string) =>
    callApi(`/gameSessions/${sessionId}/validate-answer`, { userId, answer }),

  getRanking: async (sessionId: string) => {
    const user = await ensureAuth();
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/gameSessions/${sessionId}/ranking`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
