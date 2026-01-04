// models/GameSession.ts

export interface GameSession {
  id: string;
  questionnaireId: string;
  createdBy: string;
  startedAt: number;
  endedAt?: number;
  isOpen: boolean;
}
