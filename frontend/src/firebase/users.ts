import { getFirestore, doc, setDoc } from "firebase/firestore";
import {app} from "./init";

const db = getFirestore(app);

export const createUserProfile = async (
  uid: string,
  data: {
    name: string;
    email: string;
  }
) => {
  return setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: Date.now(),
  });
};
