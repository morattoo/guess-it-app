import type { FirebaseTimestamp } from "./GameSession";

export type Questionnaire = {
  id: string;
  title: string;
  questionIds: string[];
  createdBy: string;
  createdAt: FirebaseTimestamp;
};
