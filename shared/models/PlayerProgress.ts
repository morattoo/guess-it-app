/* gameSessions/{gameSessionId}/players/
  {userId}
    → PlayerProgress */


export interface PlayerProgress {
  userId: string;
  gameSessionId: string;
  currentQuestionIndex: number;
  startedAt: number;
  finishedAt?: number;
}