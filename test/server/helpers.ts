import { getDb, resetDb, closeDb } from "../../src/shared/db.ts";
import { SCHEMA } from "../../src/shared/schema.ts";
import { createServer } from "../../src/server/index.ts";

const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "testpassword123";
let testToken = "";
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

export async function resetTestDb(): Promise<void> {
  const db = getDb();
  // Drop and recreate all tables so IDs reset
  db.run("DROP TABLE IF EXISTS sessions");
  db.run("DROP TABLE IF EXISTS users");
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

  // Seed a test user and session
  await seedTestUser();
}

async function seedTestUser(): Promise<void> {
  const db = getDb();
  const passwordHash = await Bun.password.hash(TEST_USER_PASSWORD);
  db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [TEST_USER_EMAIL, passwordHash]);

  const token = Array.from(
    crypto.getRandomValues(new Uint8Array(32)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.run("INSERT INTO sessions (user_id, token, expires_at) VALUES (1, ?, ?)", [token, expiresAt]);
  testToken = token;
}

export function getTestToken(): string {
  return testToken;
}

export function getTestBaseUrl(): string {
  return baseUrl;
}

export function api(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${testToken}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

export async function apiJson<T = unknown>(res: Response): Promise<{ ok: boolean; data: T; error?: string }> {
  return res.json() as Promise<{ ok: boolean; data: T; error?: string }>;
}
