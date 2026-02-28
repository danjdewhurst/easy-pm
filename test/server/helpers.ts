import { getDb, resetDb, closeDb } from "../../src/shared/db.ts";
import { SCHEMA } from "../../src/shared/schema.ts";
import { createServer } from "../../src/server/index.ts";

const TEST_API_KEY = "dev-api-key";
let baseUrl = "";
let serverInstance: ReturnType<typeof createServer> | null = null;

export function setupTestServer(): void {
  resetDb();
  getDb(":memory:");
  serverInstance = createServer(0);
  baseUrl = `http://localhost:${serverInstance.port}`;
}

export function teardownTestServer(): void {
  if (serverInstance) {
    serverInstance.stop(true);
    serverInstance = null;
  }
  closeDb();
  resetDb();
}

export function resetTestDb(): void {
  const db = getDb();
  // Drop and recreate all tables so IDs reset
  db.run("DROP TABLE IF EXISTS card_labels");
  db.run("DROP TABLE IF EXISTS cards_fts");
  db.run("DROP TABLE IF EXISTS cards");
  db.run("DROP TRIGGER IF EXISTS cards_ai");
  db.run("DROP TRIGGER IF EXISTS cards_ad");
  db.run("DROP TRIGGER IF EXISTS cards_au");
  db.run("DROP TABLE IF EXISTS columns");
  db.run("DROP TABLE IF EXISTS labels");
  db.run("DROP TABLE IF EXISTS boards");
  db.run("DROP TABLE IF EXISTS projects");
  db.run(SCHEMA);
}

export function getTestBaseUrl(): string {
  return baseUrl;
}

export function api(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("X-API-Key")) {
    headers.set("X-API-Key", TEST_API_KEY);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

export async function apiJson<T = unknown>(res: Response): Promise<{ ok: boolean; data: T; error?: string }> {
  return res.json() as Promise<{ ok: boolean; data: T; error?: string }>;
}
