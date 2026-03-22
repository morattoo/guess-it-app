export type RawQuestionData = {
  type: string;
  title: string;
  description?: string;
  points: number;
  timeLimitSec?: number;
  options?: unknown[];
  items?: unknown[];
  expectedAnswer?: unknown;
  createdBy: string;
};

export type MappedQuestion = {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  penaltySeconds: number;
  options?: unknown[];
  items?: unknown[];
  validation: {
    type: string;
    expectedAnswer: unknown;
  };
};

/**
 * Maps a raw Firestore question document into the snapshot format
 * stored inside a game session. Pure function — no Firestore dependency.
 */
export function mapQuestionForSession(
  id: string,
  data: RawQuestionData,
): MappedQuestion {
  return {
    id,
    type: data.type,
    title: data.title,
    description: data.description ?? "",
    points: data.points,
    penaltySeconds: data.timeLimitSec ?? 0,
    ...(data.type === "CHOICE" && data.options
      ? { options: data.options }
      : {}),
    ...(data.type === "ORDERING" && data.items ? { items: data.items } : {}),
    validation: {
      type: data.type,
      expectedAnswer: data.expectedAnswer,
    },
  };
}
