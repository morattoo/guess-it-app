import { getAuth, signInAnonymously } from 'firebase/auth';
import { app } from './init';

const auth = getAuth(app);

export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser!;
}
