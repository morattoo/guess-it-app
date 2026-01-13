import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from './init';

const db = getFirestore(app);

export const createUserProfile = async (
  uid: string,
  data: {
    name: string;
    email: string;
  }
) => {
  return setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: Date.now(),
  });
};

export const getUserProfile = async (uid: string) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data() as {
      name: string;
      email: string;
      createdAt: number;
    };
  }
  return null;
};
