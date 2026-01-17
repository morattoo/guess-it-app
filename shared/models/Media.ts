// models/Media.ts

export type MediaType = "text" | "image" | "audio";

export type Media = {
  type: MediaType;
  value: string;
  // text → texto
  // image → URL (Firebase Storage)
  // audio → URL (Firebase Storage)
  metadata?: {
    duration?: number; // audio
    language?: string;
  };
};
