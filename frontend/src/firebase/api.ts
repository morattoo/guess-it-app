import { ensureAuth } from './auth';

const API_URL =
  import.meta.env.DEV
    ? 'http://127.0.0.1:5001/YOUR_PROJECT/us-central1/gameSessionsApi'
    : 'https://us-central1-YOUR_PROJECT.cloudfunctions.net/gameSessionsApi';

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
  joinSession: (sessionId: string) =>
    callApi('/join', { sessionId }),

  submitAnswer: (sessionId: string, answer: string) =>
    callApi('/answer', { sessionId, answer }),
};
