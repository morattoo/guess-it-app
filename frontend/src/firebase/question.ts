import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './init';
import type { Question, QuestionDocument } from '@shared/models/Question';

const db = getFirestore(app);
const questionsCollection = collection(db, 'questions');

/**
 * Crear una nueva pregunta en Firestore
 */
export const createQuestion = async (question: Question, userId: string) => {
  const docRef = await addDoc(questionsCollection, {
    ...question,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Obtener una pregunta por ID
 */
export const getQuestion = async (questionId: string): Promise<QuestionDocument | null> => {
  const docRef = doc(db, 'questions', questionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as QuestionDocument;
  }
  return null;
};

/**
 * Obtener todas las preguntas
 */
export const getQuestions = async (): Promise<QuestionDocument[]> => {
  const querySnapshot = await getDocs(questionsCollection);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as QuestionDocument[];
};

/**
 * Obtener preguntas creadas por un usuario específico
 */
export const getQuestionsByUser = async (userId: string): Promise<QuestionDocument[]> => {
  const q = query(questionsCollection, where('createdBy', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as QuestionDocument[];
};

/**
 * Actualizar una pregunta existente
 */
export const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
  const docRef = doc(db, 'questions', questionId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Eliminar una pregunta
 */
export const deleteQuestion = async (questionId: string) => {
  const docRef = doc(db, 'questions', questionId);
  await deleteDoc(docRef);
};
