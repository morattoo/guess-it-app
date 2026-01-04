// models/Answer.ts

import { Media } from "./Media";

export interface Answer {
  questionId: string;
  userId: string;
  submittedAt: number;
  media: Media;
}
