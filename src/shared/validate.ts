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
