import { jsonResponse } from "../middleware.ts";

export function handleHealth(): Response {
  return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
}
