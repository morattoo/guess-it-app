// models/Question.ts
export type QuestionType =
  | "TEXT"
  | "NUMBER"
  | "CHOICE"
  | "IMAGE_UPLOAD"
  | "AUDIO_UPLOAD"
  | "ORDERING"
  | "BOOLEAN";

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

export type OrderingQuestion = BaseQuestion & {
  type: "ORDERING";
  items: {
    id: string;
    label: string;
  }[];
  expectedAnswer: {
    order: string[]; // ordered array of item IDs representing the correct sequence
  };
};

export type BooleanQuestion = BaseQuestion & {
  type: "BOOLEAN";
  expectedAnswer: {
    booleanValue: boolean;
  };
};

export type Question =
  | TextQuestion
  | NumberQuestion
  | ChoiceQuestion
  | OrderingQuestion
  | BooleanQuestion;

export type FirestoreTimestamp =
  | { seconds: number; nanoseconds: number }
  | Date
  | number;

export type QuestionDocument = Question & {
  createdBy: string;
  createdAt: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};
