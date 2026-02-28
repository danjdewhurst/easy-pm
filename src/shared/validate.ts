import { ValidationError } from "./errors.ts";
import {
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  VALID_COLOUR_PATTERN,
} from "./constants.ts";

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  return value.trim();
}

export function optionalNullableString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string or null`);
  }
  return value.trim();
}

export function validateName(value: unknown, field = "name"): string {
  const name = requireString(value, field);
  if (name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`${field} must be at most ${MAX_NAME_LENGTH} characters`);
  }
  return name;
}

export function validateTitle(value: unknown, field = "title"): string {
  const title = requireString(value, field);
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`${field} must be at most ${MAX_TITLE_LENGTH} characters`);
  }
  return title;
}

export function validateDescription(value: unknown, field = "description"): string | null | undefined {
  const desc = optionalNullableString(value, field);
  if (desc && desc.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`${field} must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
  }
  return desc;
}

export function validateColour(value: unknown, field = "colour"): string {
  const colour = requireString(value, field);
  if (!VALID_COLOUR_PATTERN.test(colour)) {
    throw new ValidationError(`${field} must be a valid hex colour (e.g. #ff0000)`);
  }
  return colour;
}

export function validatePositiveInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (typeof num !== "number" || !Number.isInteger(num) || num < 0) {
    throw new ValidationError(`${field} must be a non-negative integer`);
  }
  return num;
}

export function requirePositiveInt(value: unknown, field: string): number {
  const num = validatePositiveInt(value, field);
  if (num === undefined) {
    throw new ValidationError(`${field} is required`);
  }
  return num;
}

export function validateIntArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`);
  }
  return value.map((v, i) => {
    if (typeof v !== "number" || !Number.isInteger(v)) {
      throw new ValidationError(`${field}[${i}] must be an integer`);
    }
    return v;
  });
}

export function validateIsoDate(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO 8601 date`);
  }
  return d.toISOString();
}

/**
 * Parse a time estimate string like "5m", "1h", "1h 20m", or plain minutes "90"
 * into total minutes. Returns null for empty/null/undefined input.
 */
export function parseTimeEstimate(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return value >= 0 ? Math.round(value) : null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  // Plain number — treat as minutes
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  const pattern = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i;
  const match = trimmed.match(pattern);
  if (!match || (!match[1] && !match[2])) {
    throw new ValidationError(
      "time_estimate must be a number of minutes or a string like '1h 30m', '2h', or '45m'",
    );
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + minutes;
}

/**
 * Format minutes into a human-readable string like "1h 20m" or "45m".
 */
export function formatTimeEstimate(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export async function parseJsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new ValidationError("Request body must be a JSON object");
    }
    return body as Record<string, unknown>;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError("Invalid JSON in request body");
  }
}
