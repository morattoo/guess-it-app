// models/Validation.ts

export type ValidationStatus = "valid" | "invalid" | "partial";

export type ValidationResult = {
  status: ValidationStatus;
  confidence: number; // 0 → 1
  reason?: string;
  rawIAResponse?: unknown;
};
