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
  mode: GameSessionMode;
  title: string;
  players: string[]; // Lista de userIds de los jugadores inscritos
};

export type GameSessionStatus = "WAITING" | "RUNNING" | "FINISHED";
export type GameSessionMode = "EVALUATION" | "LEARNING";

export type FirebaseTimestamp = { seconds: number; nanoseconds: number };

/* gameSessions/{gameSessionId}/players/
  {userId}
    → PlayerProgress */

export type PlayerProgress = {
  userId: string;
  displayName: string;
  currentQuestionIndex: number;
  score: number;
  totalPenaltySeconds: number;
  startedAt?: FirebaseTimestamp;
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
  options?: { id: string; label: string }[]; // Solo para preguntas de tipo CHOICE
  items?: { id: string; label: string }[]; // Solo para preguntas de tipo ORDERING
};

export type QuestionValidation =
  | TextValidation
  | NumberValidation
  | ChoiceValidation
  | OrderingValidation;

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
  options: { id: string; label: string }[];
};

export type OrderingValidation = {
  type: "ORDERING";
  expectedAnswer: {
    order: string[]; // correct sequence of item IDs
  };
  options: { id: string; label: string }[]; // items exposed to player (no order info)
};

// Ranking API Response Types
export type RankingPlayer = {
  userId: string;
  displayName: string;
  score: number;
  totalPenaltySeconds: number;
  finishedAt: FirebaseTimestamp | null;
  startedAt: FirebaseTimestamp | null;
  currentQuestionIndex: number;
  totalTime: number;
  progressPercentage: number;
};

export type GameRankingResponse = {
  sessionId: string;
  status: GameSessionStatus;
  totalQuestions: number;
  players: RankingPlayer[];
  timestamp: number;
};
