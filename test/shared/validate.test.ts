import { test, expect, describe } from "bun:test";
import { parseTimeEstimate, formatTimeEstimate } from "../../src/shared/validate.ts";

describe("parseTimeEstimate", () => {
  test("returns null for empty/null/undefined", () => {
    expect(parseTimeEstimate(null)).toBeNull();
    expect(parseTimeEstimate(undefined)).toBeNull();
    expect(parseTimeEstimate("")).toBeNull();
    expect(parseTimeEstimate("  ")).toBeNull();
  });

  test("parses plain numbers as minutes", () => {
    expect(parseTimeEstimate("30")).toBe(30);
    expect(parseTimeEstimate("0")).toBe(0);
    expect(parseTimeEstimate("120")).toBe(120);
  });

  test("passes through numeric values", () => {
    expect(parseTimeEstimate(45)).toBe(45);
    expect(parseTimeEstimate(0)).toBe(0);
  });

  test("returns null for negative numbers", () => {
    expect(parseTimeEstimate(-5)).toBeNull();
  });

  test("parses minutes-only format", () => {
    expect(parseTimeEstimate("30m")).toBe(30);
    expect(parseTimeEstimate("5m")).toBe(5);
    expect(parseTimeEstimate("45M")).toBe(45);
  });

  test("parses hours-only format", () => {
    expect(parseTimeEstimate("1h")).toBe(60);
    expect(parseTimeEstimate("2h")).toBe(120);
    expect(parseTimeEstimate("2H")).toBe(120);
  });

  test("parses combined hours and minutes", () => {
    expect(parseTimeEstimate("1h 30m")).toBe(90);
    expect(parseTimeEstimate("2h 15m")).toBe(135);
    expect(parseTimeEstimate("1h30m")).toBe(90);
    expect(parseTimeEstimate("1H 30M")).toBe(90);
  });

  test("throws on invalid format", () => {
    expect(() => parseTimeEstimate("abc")).toThrow();
    expect(() => parseTimeEstimate("1d")).toThrow();
    expect(() => parseTimeEstimate("1h 30")).toThrow();
  });
});

describe("formatTimeEstimate", () => {
  test("returns empty string for null/undefined", () => {
    expect(formatTimeEstimate(null)).toBe("");
    expect(formatTimeEstimate(undefined)).toBe("");
  });

  test("formats minutes only", () => {
    expect(formatTimeEstimate(30)).toBe("30m");
    expect(formatTimeEstimate(5)).toBe("5m");
  });

  test("formats hours only", () => {
    expect(formatTimeEstimate(60)).toBe("1h");
    expect(formatTimeEstimate(120)).toBe("2h");
  });

  test("formats hours and minutes", () => {
    expect(formatTimeEstimate(90)).toBe("1h 30m");
    expect(formatTimeEstimate(135)).toBe("2h 15m");
  });
});
