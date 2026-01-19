import { API_ENDPOINTS } from './config';
import { getCurrentUser, auth } from './auth';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import type { GameSession } from '@shared/models/GameSession';

const API_URL = API_ENDPOINTS.publicGame;

/**
 * Función auxiliar para llamar a la API pública (sin autenticación requerida)
 */
async function callPublicGameApi(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Error en la petición');
  }

  return res.json();
}

/**
 * Obtener sesión pública (sin respuestas correctas)
 */
export const getPublicGameSession = async (gameSessionId: string): Promise<GameSession | null> => {
  try {
    const response = await callPublicGameApi(`/game/${gameSessionId}`, 'GET');
    return response as GameSession;
  } catch (error) {
    console.error('Error fetching public game session:', error);
    return null;
  }
};

/**
 * Unirse a una sesión de juego (con autenticación anónima si es necesario)
 */
export const joinPublicGameSession = async (
  gameSessionId: string,
  displayName?: string
): Promise<void> => {
  // Obtener usuario actual o crear uno anónimo
  let user = await getCurrentUser();

  if (!user) {
    // Crear usuario anónimo
    await signInAnonymously(auth);
    user = auth.currentUser;
  }

  if (!user) {
    throw new Error('No se pudo autenticar');
  }

  // Si hay displayName y el usuario es anónimo, actualizarlo
  if (displayName && user.isAnonymous) {
    await updateProfile(user, { displayName });
  }

  const nameToUse = displayName || user.displayName || 'Jugador Anónimo';

  await callPublicGameApi(`/game/${gameSessionId}/join`, 'POST', {
    userId: user.uid,
    displayName: nameToUse,
  });
};

/**
 * Obtener el progreso del jugador actual
 */
export const getPublicPlayerProgress = async (gameSessionId: string): Promise<any | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const response = await callPublicGameApi(`/game/${gameSessionId}/players/${user.uid}`, 'GET');
    return response;
  } catch (error) {
    console.error('Error fetching player progress:', error);
    return null;
  }
};

/**
 * Enviar una respuesta a una pregunta
 */
export const submitPublicAnswer = async (
  gameSessionId: string,
  questionIndex: number,
  answer: string | number
): Promise<{
  correct: boolean;
  message?: string;
  nextQuestionIndex?: number;
  finished?: boolean;
}> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Debes estar autenticado para responder');
  }

  const response = await callPublicGameApi(
    `/game/${gameSessionId}/players/${user.uid}/answer`,
    'POST',
    {
      questionIndex,
      answer,
    }
  );
  return response;
};

/**
 * Obtener el ranking de la sesión
 */
export const getPublicRanking = async (gameSessionId: string): Promise<any[]> => {
  try {
    const response = await callPublicGameApi(`/game/${gameSessionId}/ranking`, 'GET');
    return response;
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return [];
  }
};
