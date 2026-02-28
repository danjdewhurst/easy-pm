import { AppError, AuthError } from "../shared/errors.ts";
import type { ApiResponse } from "../shared/types.ts";

const API_KEY = process.env["EASY_PM_API_KEY"] ?? "dev-api-key";

export function jsonResponse<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = { ok: true, data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    const body: ApiResponse = { ok: false, error: error.message };
    return new Response(JSON.stringify(body), {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.error("Unhandled error:", error);
  const body: ApiResponse = { ok: false, error: "Internal server error" };
  return new Response(JSON.stringify(body), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

type RouteHandler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return (req, params) => {
    const key = req.headers.get("X-API-Key");
    if (key !== API_KEY) {
      throw new AuthError();
    }
    return handler(req, params);
  };
}

/** Extract URL params from a matched route pattern */
export function matchRoute(
  pathname: string,
  pattern: string,
): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const val = pathParts[i]!;
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = val;
    } else if (pp !== val) {
      return null;
    }
  }
  return params;
}
