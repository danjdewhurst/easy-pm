import { describe, expect, test } from "bun:test";
import { ValidationError } from "../../src/shared/errors.ts";
import {
	formatTimeEstimate,
	optionalNullableString,
	optionalString,
	parseJsonBody,
	parseTimeEstimate,
	requirePositiveInt,
	requireString,
	validateColour,
	validateDescription,
	validateEmail,
	validateIntArray,
	validateIsoDate,
	validateName,
	validatePassword,
	validatePositiveInt,
	validateTitle,
} from "../../src/shared/validate.ts";

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

// ─── requireString ───────────────────────────────────────────────

describe("requireString", () => {
	test("returns trimmed string", () => {
		expect(requireString("  hello  ", "field")).toBe("hello");
	});

	test("throws on empty string", () => {
		expect(() => requireString("", "field")).toThrow(ValidationError);
		expect(() => requireString("   ", "field")).toThrow(ValidationError);
	});

	test("throws on non-string", () => {
		expect(() => requireString(123, "field")).toThrow(ValidationError);
		expect(() => requireString(null, "field")).toThrow(ValidationError);
		expect(() => requireString(undefined, "field")).toThrow(ValidationError);
	});
});

// ─── optionalString ──────────────────────────────────────────────

describe("optionalString", () => {
	test("returns undefined for null/undefined", () => {
		expect(optionalString(undefined, "f")).toBeUndefined();
		expect(optionalString(null, "f")).toBeUndefined();
	});

	test("returns trimmed string", () => {
		expect(optionalString("  hi  ", "f")).toBe("hi");
	});

	test("throws on non-string", () => {
		expect(() => optionalString(123, "f")).toThrow(ValidationError);
	});
});

// ─── optionalNullableString ──────────────────────────────────────

describe("optionalNullableString", () => {
	test("returns undefined for undefined", () => {
		expect(optionalNullableString(undefined, "f")).toBeUndefined();
	});

	test("returns null for null", () => {
		expect(optionalNullableString(null, "f")).toBeNull();
	});

	test("returns trimmed string", () => {
		expect(optionalNullableString("  hi  ", "f")).toBe("hi");
	});

	test("throws on non-string", () => {
		expect(() => optionalNullableString(123, "f")).toThrow(ValidationError);
	});
});

// ─── validateName ────────────────────────────────────────────────

describe("validateName", () => {
	test("returns valid name", () => {
		expect(validateName("Project X")).toBe("Project X");
	});

	test("throws on name exceeding max length", () => {
		expect(() => validateName("a".repeat(256))).toThrow(ValidationError);
	});
});

// ─── validateTitle ───────────────────────────────────────────────

describe("validateTitle", () => {
	test("returns valid title", () => {
		expect(validateTitle("My Task")).toBe("My Task");
	});

	test("throws on title exceeding max length", () => {
		expect(() => validateTitle("a".repeat(501))).toThrow(ValidationError);
	});
});

// ─── validateDescription ─────────────────────────────────────────

describe("validateDescription", () => {
	test("returns undefined/null for missing values", () => {
		expect(validateDescription(undefined)).toBeUndefined();
		expect(validateDescription(null)).toBeNull();
	});

	test("returns valid description", () => {
		expect(validateDescription("A desc")).toBe("A desc");
	});

	test("throws on description exceeding max length", () => {
		expect(() => validateDescription("a".repeat(5001))).toThrow(
			ValidationError,
		);
	});
});

// ─── validatePositiveInt ─────────────────────────────────────────

describe("validatePositiveInt", () => {
	test("returns undefined for null/undefined", () => {
		expect(validatePositiveInt(undefined, "f")).toBeUndefined();
		expect(validatePositiveInt(null, "f")).toBeUndefined();
	});

	test("parses string to int", () => {
		expect(validatePositiveInt("42", "f")).toBe(42);
	});

	test("passes through number", () => {
		expect(validatePositiveInt(10, "f")).toBe(10);
	});

	test("throws on negative number", () => {
		expect(() => validatePositiveInt(-1, "f")).toThrow(ValidationError);
	});

	test("throws on non-integer", () => {
		expect(() => validatePositiveInt(1.5, "f")).toThrow(ValidationError);
	});

	test("throws on non-numeric value", () => {
		expect(() => validatePositiveInt("abc", "f")).toThrow(ValidationError);
	});
});

// ─── requirePositiveInt ──────────────────────────────────────────

describe("requirePositiveInt", () => {
	test("returns number", () => {
		expect(requirePositiveInt(5, "f")).toBe(5);
	});

	test("throws when undefined", () => {
		expect(() => requirePositiveInt(undefined, "f")).toThrow(ValidationError);
	});
});

// ─── validateIntArray ────────────────────────────────────────────

describe("validateIntArray", () => {
	test("returns valid int array", () => {
		expect(validateIntArray([1, 2, 3], "f")).toEqual([1, 2, 3]);
	});

	test("throws on non-array", () => {
		expect(() => validateIntArray("not array", "f")).toThrow(ValidationError);
	});

	test("throws on non-integer element", () => {
		expect(() => validateIntArray([1, "two"], "f")).toThrow(ValidationError);
		expect(() => validateIntArray([1.5], "f")).toThrow(ValidationError);
	});
});

// ─── validateIsoDate ─────────────────────────────────────────────

describe("validateIsoDate", () => {
	test("returns undefined for undefined", () => {
		expect(validateIsoDate(undefined, "f")).toBeUndefined();
	});

	test("returns null for null", () => {
		expect(validateIsoDate(null, "f")).toBeNull();
	});

	test("returns ISO string for valid date", () => {
		const result = validateIsoDate("2024-01-15", "f");
		expect(result).toContain("2024-01-15");
	});

	test("throws on non-string", () => {
		expect(() => validateIsoDate(123, "f")).toThrow(ValidationError);
	});

	test("throws on invalid date string", () => {
		expect(() => validateIsoDate("not-a-date", "f")).toThrow(ValidationError);
	});
});

// ─── validateEmail ───────────────────────────────────────────────

describe("validateEmail", () => {
	test("returns lowercased email", () => {
		expect(validateEmail("Test@Example.COM")).toBe("test@example.com");
	});

	test("throws on email exceeding max length", () => {
		expect(() => validateEmail(`${"a".repeat(250)}@b.co`)).toThrow(
			ValidationError,
		);
	});

	test("throws on invalid format", () => {
		expect(() => validateEmail("not-an-email")).toThrow(ValidationError);
	});
});

// ─── validatePassword ────────────────────────────────────────────

describe("validatePassword", () => {
	test("returns valid password", () => {
		expect(validatePassword("longpassword")).toBe("longpassword");
	});

	test("throws on non-string", () => {
		expect(() => validatePassword(123)).toThrow(ValidationError);
	});

	test("throws on short password", () => {
		expect(() => validatePassword("short")).toThrow(ValidationError);
	});
});

// ─── validateColour ──────────────────────────────────────────────

describe("validateColour", () => {
	test("returns valid hex colour", () => {
		expect(validateColour("#ff0000")).toBe("#ff0000");
		expect(validateColour("#00FF00")).toBe("#00FF00");
		expect(validateColour("#abcdef")).toBe("#abcdef");
	});

	test("throws on missing hash", () => {
		expect(() => validateColour("ff0000")).toThrow(ValidationError);
	});

	test("throws on short hex", () => {
		expect(() => validateColour("#fff")).toThrow(ValidationError);
	});

	test("throws on invalid characters", () => {
		expect(() => validateColour("#gggggg")).toThrow(ValidationError);
	});

	test("throws on empty string", () => {
		expect(() => validateColour("")).toThrow(ValidationError);
	});

	test("throws on non-string", () => {
		expect(() => validateColour(123)).toThrow(ValidationError);
	});

	test("throws on too-long hex", () => {
		expect(() => validateColour("#ff00000")).toThrow(ValidationError);
	});
});

// ─── validatePassword (max length) ──────────────────────────────

describe("validatePassword max length", () => {
	test("throws on password exceeding max length", () => {
		expect(() => validatePassword("a".repeat(257))).toThrow(ValidationError);
	});

	test("accepts password at max length boundary", () => {
		expect(validatePassword("a".repeat(256))).toBe("a".repeat(256));
	});
});

// ─── parseJsonBody ───────────────────────────────────────────────

describe("parseJsonBody", () => {
	test("parses valid JSON object", async () => {
		const req = new Request("http://test.com", {
			method: "POST",
			body: JSON.stringify({ key: "value" }),
			headers: { "Content-Type": "application/json" },
		});
		const result = await parseJsonBody(req);
		expect(result).toEqual({ key: "value" });
	});

	test("throws on array body", async () => {
		const req = new Request("http://test.com", {
			method: "POST",
			body: JSON.stringify([1, 2]),
			headers: { "Content-Type": "application/json" },
		});
		expect(parseJsonBody(req)).rejects.toThrow(ValidationError);
	});

	test("throws on null body", async () => {
		const req = new Request("http://test.com", {
			method: "POST",
			body: JSON.stringify(null),
			headers: { "Content-Type": "application/json" },
		});
		expect(parseJsonBody(req)).rejects.toThrow(ValidationError);
	});

	test("throws on invalid JSON", async () => {
		const req = new Request("http://test.com", {
			method: "POST",
			body: "not json",
			headers: { "Content-Type": "application/json" },
		});
		expect(parseJsonBody(req)).rejects.toThrow(ValidationError);
	});
});
