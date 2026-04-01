import { ensureAuth } from './auth';
import { API_ENDPOINTS } from './config';
import { getToken } from 'firebase/app-check';
import { getAppCheck } from './appCheck';

export type ActiveSessionSummary = {
  id: string;
  title: string;
  status: 'WAITING' | 'RUNNING';
  totalPlayers: number;
  finishedPlayers: number;
  totalQuestions: number;
};

export type DashboardData = {
  activeSessions: ActiveSessionSummary[];
  totalQuestionnaires: number;
  totalQuestions: number;
};

const API_URL = API_ENDPOINTS.dashboard;

async function callDashboardApi(path: string) {
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

  const res = await fetch(`${API_URL}${path}`, { method: 'GET', headers });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const getDashboardData = async (userId: string): Promise<DashboardData> => {
  return callDashboardApi(`/dashboard?userId=${encodeURIComponent(userId)}`);
};
