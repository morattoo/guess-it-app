// models/Question.ts
export type QuestionType =
  | "TEXT"
  | "NUMBER"
  | "CHOICE"
  | "IMAGE_UPLOAD"
  | "AUDIO_UPLOAD"
  | "ORDERING";

export type BaseQuestion = {
  id?: string;
  type: QuestionType;
  title: string;
  description?: string;
  points: number;
  timeLimitSec?: number;
};

export type TextQuestion = BaseQuestion & {
  type: "TEXT";
  expectedAnswer: {
    text: string;
    caseSensitive?: boolean;
  };
};

export type NumberQuestion = BaseQuestion & {
  type: "NUMBER";
  expectedAnswer: {
    value: number;
    tolerance?: number;
  };
};

export type ChoiceQuestion = BaseQuestion & {
  type: "CHOICE";
  options: {
    id: string;
    label: string;
  }[];
  expectedAnswer: {
    optionId: string;
  };
};

export type Question = TextQuestion | NumberQuestion | ChoiceQuestion;

export type FirestoreTimestamp =
  | { seconds: number; nanoseconds: number }
  | Date
  | number;

export type QuestionDocument = Question & {
  createdBy: string;
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};
