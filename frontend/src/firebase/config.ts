// Configuración centralizada de URLs de API
const PROJECT_ID = 'guess-it-app-c553b';
const REGION = 'us-central1';

const getApiBaseUrl = () => {
  return import.meta.env.DEV
    ? `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`
    : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
};

const BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  questions: `${BASE_URL}/questions`,
  gameSessions: `${BASE_URL}/gameSessions`,
  questionnaires: `${BASE_URL}/questionnaires`,
};

export { PROJECT_ID, REGION };
