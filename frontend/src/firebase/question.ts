import { ensureAuth } from './auth';
import { API_ENDPOINTS } from './config';
import type { Question, QuestionDocument } from '@shared/models/Question';

const API_URL = API_ENDPOINTS.questions;

async function callQuestionsApi(
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
 * Crear una nueva pregunta en Firestore
 */
export const createQuestion = async (question: Question, userId: string): Promise<string> => {
  const response = await callQuestionsApi('/questions', 'POST', { question, userId });
  return response.questionId;
};

/**
 * Obtener una pregunta por ID
 */
export const getQuestion = async (questionId: string): Promise<QuestionDocument | null> => {
  try {
    const response = await callQuestionsApi(`/questions/${questionId}`, 'GET');
    return response as QuestionDocument;
  } catch (error) {
    return null;
  }
};

/**
 * Obtener todas las preguntas
 */
export const getQuestions = async (): Promise<QuestionDocument[]> => {
  const user = await ensureAuth();
  return getQuestionsByUser(user.uid);
};

/**
 * Obtener preguntas creadas por un usuario específico
 */
export const getQuestionsByUser = async (userId: string): Promise<QuestionDocument[]> => {
  const response = await callQuestionsApi(`/questions?userId=${userId}`, 'GET');
  return response as QuestionDocument[];
};

/**
 * Actualizar una pregunta existente
 */
export const updateQuestion = async (
  questionId: string,
  updates: Partial<Question>
): Promise<void> => {
  const user = await ensureAuth();
  await callQuestionsApi(`/questions/${questionId}`, 'PUT', { updates, userId: user.uid });
};

/**
 * Eliminar una pregunta
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  const user = await ensureAuth();
  await callQuestionsApi(`/questions/${questionId}?userId=${user.uid}`, 'DELETE');
};
