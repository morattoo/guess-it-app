// Constantes para tipos de preguntas
export const QUESTION_TYPES = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  CHOICE: 'CHOICE',
  IMAGE_UPLOAD: 'IMAGE_UPLOAD',
  AUDIO_UPLOAD: 'AUDIO_UPLOAD',
  ORDERING: 'ORDERING',
} as const;

export type QuestionTypeValue = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];
