import { ensureAuth } from './auth';
import { API_ENDPOINTS } from './config';
import { getToken } from 'firebase/app-check';
import { getAppCheck } from './appCheck';
import type { UserProfileData } from '@shared/models/UserProfile';

const API_URL = API_ENDPOINTS.users;

async function callUsersApi(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown) {
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
    const errorText = await res.text();
    throw new Error(errorText || 'Error en la petición');
  }

  return res.json();
}

export const createUserProfile = async (
  uid: string,
  data: {
    name: string;
    email: string;
  }
): Promise<void> => {
  await callUsersApi('/users', 'POST', { uid, ...data });
};

export const getUserProfile = async (uid: string): Promise<UserProfileData | null> => {
  try {
    const response = await callUsersApi(`/users/${uid}`, 'GET');
    return response;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
