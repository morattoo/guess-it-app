// models/Answer.ts

import { Media } from "./Media";

export type Answer = {
  questionId: string;
  userId: string;
  submittedAt: number;
  media: Media;
};
