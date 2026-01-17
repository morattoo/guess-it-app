import { ensureAuth } from './auth';
import { API_ENDPOINTS } from './config';
import type { GameSession } from '@shared/models/GameSession';

const API_URL = API_ENDPOINTS.gameSessions;

async function callGameSessionsApi(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: unknown
) {
  const user = await ensureAuth();
  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
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

/**
 * Crear una nueva sesión de juego
 */
export const createGameSession = async (
  questionnaireId: string,
  userId: string
): Promise<string> => {
  const response = await callGameSessionsApi('/gameSessions', 'POST', {
    questionnaireId,
    userId,
  });
  return response.gameSessionId;
};

/**
 * Obtener una sesión de juego por ID
 */
export const getGameSession = async (gameSessionId: string): Promise<GameSession | null> => {
  try {
    const response = await callGameSessionsApi(`/gameSessions/${gameSessionId}`, 'GET');
    return response as GameSession;
  } catch (error) {
    return null;
  }
};

/**
 * Obtener todas las sesiones del usuario
 */
export const getGameSessionsByUser = async (userId: string): Promise<GameSession[]> => {
  const response = await callGameSessionsApi(`/gameSessions?userId=${userId}`, 'GET');
  return response as GameSession[];
};

/**
 * Actualizar el estado de una sesión
 */
export const updateGameSessionStatus = async (
  gameSessionId: string,
  status: 'WAITING' | 'RUNNING' | 'FINISHED'
): Promise<void> => {
  const user = await ensureAuth();
  await callGameSessionsApi(`/gameSessions/${gameSessionId}/status`, 'PUT', {
    status,
    userId: user.uid,
  });
};

/**
 * Recopiar las preguntas del cuestionario (solo en WAITING)
 */
export const refreshGameSessionQuestions = async (gameSessionId: string): Promise<number> => {
  const user = await ensureAuth();
  const response = await callGameSessionsApi(
    `/gameSessions/${gameSessionId}/refresh-questions`,
    'PUT',
    { userId: user.uid }
  );
  return response.questionCount;
};

/**
 * Eliminar una sesión de juego (solo en WAITING)
 */
export const deleteGameSession = async (gameSessionId: string): Promise<void> => {
  const user = await ensureAuth();
  await callGameSessionsApi(`/gameSessions/${gameSessionId}?userId=${user.uid}`, 'DELETE');
};
