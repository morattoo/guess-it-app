// models/Question.ts
export type QuestionType = "text" | "image" | "audio";

export interface Question {
  id: string;
  prompt: string;
  expectedAnswer: string;
}
