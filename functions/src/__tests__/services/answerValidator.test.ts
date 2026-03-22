import { validateAnswer } from "../../services/answerValidator";

describe("validateAnswer", () => {
  // ─── TEXT ───────────────────────────────────────────────────────────────────

  describe("TEXT", () => {
    const q = (caseSensitive = false) => ({
      type: "TEXT",
      points: 10,
      validation: { expectedAnswer: { text: "Paris", caseSensitive } },
    });

    it("returns correct when answer matches (case-insensitive)", () => {
      const r = validateAnswer(q(), "paris");
      expect(r).toEqual({ ok: true, isCorrect: true });
    });

    it("returns incorrect when answer does not match", () => {
      const r = validateAnswer(q(), "London");
      expect(r).toEqual({ ok: true, isCorrect: false });
    });

    it("trims whitespace before comparing", () => {
      expect(validateAnswer(q(), "  Paris  ")).toEqual({
        ok: true,
        isCorrect: true,
      });
    });

    it("case-sensitive: fails on wrong case", () => {
      expect(validateAnswer(q(true), "paris")).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("case-sensitive: passes on exact match", () => {
      expect(validateAnswer(q(true), "Paris")).toEqual({
        ok: true,
        isCorrect: true,
      });
    });

    it("returns error when validation data is missing text", () => {
      const r = validateAnswer(
        { type: "TEXT", points: 5, validation: { expectedAnswer: {} } },
        "x",
      );
      expect(r).toMatchObject({ ok: false });
    });
  });

  // ─── NUMBER ─────────────────────────────────────────────────────────────────

  describe("NUMBER", () => {
    const q = (value: number, tolerance = 0) => ({
      type: "NUMBER",
      points: 10,
      validation: { expectedAnswer: { value, tolerance } },
    });

    it("returns correct on exact match", () => {
      expect(validateAnswer(q(42), 42)).toEqual({ ok: true, isCorrect: true });
    });

    it("returns correct within tolerance", () => {
      expect(validateAnswer(q(100, 5), 103)).toEqual({
        ok: true,
        isCorrect: true,
      });
    });

    it("returns incorrect outside tolerance", () => {
      expect(validateAnswer(q(100, 5), 106)).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("accepts numeric string answers", () => {
      expect(validateAnswer(q(7), "7")).toEqual({ ok: true, isCorrect: true });
    });

    it("returns incorrect for NaN input", () => {
      expect(validateAnswer(q(7), "abc")).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("returns error when value is missing", () => {
      const r = validateAnswer(
        { type: "NUMBER", points: 5, validation: { expectedAnswer: {} } },
        5,
      );
      expect(r).toMatchObject({ ok: false });
    });
  });

  // ─── CHOICE ─────────────────────────────────────────────────────────────────

  describe("CHOICE", () => {
    const q = (optionId: string) => ({
      type: "CHOICE",
      points: 10,
      validation: { expectedAnswer: { optionId } },
    });

    it("returns correct when optionId matches", () => {
      expect(validateAnswer(q("opt-a"), "opt-a")).toEqual({
        ok: true,
        isCorrect: true,
      });
    });

    it("returns incorrect when optionId does not match", () => {
      expect(validateAnswer(q("opt-a"), "opt-b")).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("coerces answer to string for comparison", () => {
      expect(validateAnswer(q("1"), 1)).toEqual({ ok: true, isCorrect: true });
    });

    it("returns error when optionId is missing", () => {
      const r = validateAnswer(
        { type: "CHOICE", points: 5, validation: { expectedAnswer: {} } },
        "x",
      );
      expect(r).toMatchObject({ ok: false });
    });
  });

  // ─── ORDERING ───────────────────────────────────────────────────────────────

  describe("ORDERING", () => {
    const q = (order: string[]) => ({
      type: "ORDERING",
      points: 10,
      validation: { expectedAnswer: { order } },
    });

    it("returns correct when order matches exactly", () => {
      expect(validateAnswer(q(["a", "b", "c"]), ["a", "b", "c"])).toEqual({
        ok: true,
        isCorrect: true,
      });
    });

    it("returns incorrect when order is wrong", () => {
      expect(validateAnswer(q(["a", "b", "c"]), ["a", "c", "b"])).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("returns incorrect when length differs", () => {
      expect(validateAnswer(q(["a", "b", "c"]), ["a", "b"])).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("accepts JSON-stringified array as answer", () => {
      expect(validateAnswer(q(["x", "y"]), JSON.stringify(["x", "y"]))).toEqual(
        { ok: true, isCorrect: true },
      );
    });

    it("returns incorrect for invalid JSON string", () => {
      expect(validateAnswer(q(["x", "y"]), "not-json")).toEqual({
        ok: true,
        isCorrect: false,
      });
    });

    it("returns error when order is missing", () => {
      const r = validateAnswer(
        { type: "ORDERING", points: 5, validation: { expectedAnswer: {} } },
        ["a"],
      );
      expect(r).toMatchObject({ ok: false });
    });
  });

  // ─── UNKNOWN TYPE ────────────────────────────────────────────────────────────

  it("returns error for unknown question type", () => {
    const r = validateAnswer(
      { type: "UNKNOWN", points: 5, validation: { expectedAnswer: {} } },
      "x",
    );
    expect(r).toMatchObject({ ok: false });
  });
});
