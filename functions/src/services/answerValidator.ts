export type QuestionValidation = {
  expectedAnswer: {
    text?: string;
    caseSensitive?: boolean;
    value?: number;
    tolerance?: number;
    optionId?: string;
    order?: string[];
    booleanValue?: boolean;
  };
};

export type StoredQuestion = {
  type: string;
  validation: QuestionValidation;
  penaltySeconds?: number;
  points: number;
};

export type ValidationResult =
  | { ok: true; isCorrect: boolean }
  | { ok: false; error: string };

/**
 * Pure function — validates a player answer against a stored question.
 * No Firestore, no Express. Fully testable in isolation.
 */
export function validateAnswer(
  question: StoredQuestion,
  answer: unknown,
): ValidationResult {
  const validation = question.validation;

  switch (question.type) {
    case "TEXT": {
      const expectedText = validation.expectedAnswer?.text;
      if (typeof expectedText !== "string") {
        return {
          ok: false,
          error: "Invalid question validation: missing text",
        };
      }
      const caseSensitive = validation.expectedAnswer?.caseSensitive ?? false;
      const answerText = String(answer).trim();
      const isCorrect = caseSensitive
        ? expectedText === answerText
        : expectedText.toLowerCase() === answerText.toLowerCase();
      return { ok: true, isCorrect };
    }

    case "NUMBER": {
      const expectedValue = validation.expectedAnswer?.value;
      if (typeof expectedValue !== "number") {
        return {
          ok: false,
          error: "Invalid question validation: missing value",
        };
      }
      const tolerance = validation.expectedAnswer?.tolerance ?? 0;
      const answerNumber = Number(answer);
      if (Number.isNaN(answerNumber)) {
        return { ok: true, isCorrect: false };
      }
      return {
        ok: true,
        isCorrect: Math.abs(answerNumber - expectedValue) <= tolerance,
      };
    }

    case "CHOICE": {
      const expectedOptionId = validation.expectedAnswer?.optionId;
      if (!expectedOptionId) {
        return {
          ok: false,
          error: "Invalid question validation: missing optionId",
        };
      }
      return {
        ok: true,
        isCorrect: String(answer) === String(expectedOptionId),
      };
    }

    case "ORDERING": {
      const expectedOrder = validation.expectedAnswer?.order;
      if (!Array.isArray(expectedOrder)) {
        return {
          ok: false,
          error: "Invalid question validation: missing order",
        };
      }
      let submittedOrder: string[];
      try {
        submittedOrder = Array.isArray(answer)
          ? (answer as string[])
          : JSON.parse(String(answer));
      } catch {
        return { ok: true, isCorrect: false };
      }
      const isCorrect =
        Array.isArray(submittedOrder) &&
        expectedOrder.length === submittedOrder.length &&
        expectedOrder.every((id, i) => id === submittedOrder[i]);
      return { ok: true, isCorrect };
    }

    case "BOOLEAN": {
      const expectedValue = validation.expectedAnswer?.booleanValue;
      if (typeof expectedValue !== "boolean") {
        return {
          ok: false,
          error: "Invalid question validation: missing booleanValue",
        };
      }
      const submittedValue =
        typeof answer === "boolean"
          ? answer
          : String(answer).toLowerCase() === "true";
      return { ok: true, isCorrect: submittedValue === expectedValue };
    }

    default:
      return {
        ok: false,
        error: `Unsupported question type: ${question.type}`,
      };
  }
}
