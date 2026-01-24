import { ensureAuth } from './auth';
import { API_ENDPOINTS } from './config';
import { getToken } from 'firebase/app-check';
import { getAppCheck } from './appCheck';
import type { Questionnaire } from '@shared/models/Questionnaire';

const API_URL = API_ENDPOINTS.questionnaires;

async function callQuestionnairesApi(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: unknown
) {
  const user = await ensureAuth();
  const token = await user.getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const appCheck = getAppCheck();
  if (appCheck) {
    try {
      const appCheckToken = await getToken(appCheck, false);
      headers['X-Firebase-AppCheck'] = appCheckToken.token;
    } catch (error) {
      console.warn('Error getting App Check token:', error);
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * Crear un nuevo cuestionario
 */
export const createQuestionnaire = async (
  title: string,
  questionIds: string[]
): Promise<string> => {
  const user = await ensureAuth();
  const response = await callQuestionnairesApi('/questionnaires', 'POST', {
    questionnaire: { title, questionIds },
    userId: user.uid,
  });
  return response.questionnaireId;
};

/**
 * Obtener un cuestionario por ID
 */
export const getQuestionnaire = async (questionnaireId: string): Promise<Questionnaire | null> => {
  try {
    const response = await callQuestionnairesApi(`/questionnaires/${questionnaireId}`, 'GET');
    return response as Questionnaire;
  } catch (error) {
    return null;
  }
};

/**
 * Obtener todos los cuestionarios del usuario
 */
export const getQuestionnairesByUser = async (userId: string): Promise<Questionnaire[]> => {
  const response = await callQuestionnairesApi(`/questionnaires?userId=${userId}`, 'GET');
  return response as Questionnaire[];
};

/**
 * Actualizar un cuestionario existente
 */
export const updateQuestionnaire = async (
  questionnaireId: string,
  updates: { title?: string; questionIds?: string[] }
): Promise<void> => {
  const user = await ensureAuth();
  await callQuestionnairesApi(`/questionnaires/${questionnaireId}`, 'PUT', {
    updates,
    userId: user.uid,
  });
};

/**
 * Eliminar un cuestionario
 */
export const deleteQuestionnaire = async (questionnaireId: string): Promise<void> => {
  const user = await ensureAuth();
  await callQuestionnairesApi(`/questionnaires/${questionnaireId}?userId=${user.uid}`, 'DELETE');
};
