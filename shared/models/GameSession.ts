// models/GameSession.ts

import type { QuestionType } from "./Question";

export type GameSession = {
  id?: string;
  questionnaireId: string;
  questions: GameSessionQuestion[];
  status: GameSessionStatus;
  createdBy: string;
  startedAt: FirebaseTimestamp;
  endedAt?: FirebaseTimestamp;
  isOpen: boolean;
};

export type GameSessionStatus = "WAITING" | "RUNNING" | "FINISHED";

export type FirebaseTimestamp =
  | number
  | Date
  | { _seconds: number; _nanoseconds: number };

/* gameSessions/{gameSessionId}/players/
  {userId}
    → PlayerProgress */

export type PlayerProgress = {
  userId: string;
  currentQuestionIndex: number;
  score: number;
  totalPenaltySeconds: number;
  startedAt: FirebaseTimestamp;
  finishedAt?: FirebaseTimestamp;
  lastAnswerAt?: FirebaseTimestamp;
};

export type GameSessionQuestion = {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  points: number;
  penaltySeconds: number;
  validation: QuestionValidation;
};

export type QuestionValidation =
  | TextValidation
  | NumberValidation
  | ChoiceValidation;

export type TextValidation = {
  type: "TEXT";
  expectedAnswer: {
    text: string;
    caseSensitive?: boolean;
  };
};

export type NumberValidation = {
  type: "NUMBER";
  expectedAnswer: {
    value: number;
    tolerance?: number;
  };
};

export type ChoiceValidation = {
  type: "CHOICE";
  expectedAnswer: {
    optionId: string;
  };
};
