import { createServer } from "../../src/server/index.ts";
import { closeDb, getDb, resetDb } from "../../src/shared/db.ts";

const TEST_USER_EMAIL = "test@example.com";
const TEST_USER_PASSWORD = "testpassword123";
const TEST_USER2_EMAIL = "other@example.com";
const TEST_USER2_PASSWORD = "otherpassword123";
let testToken = "";
let testToken2 = "";
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
	// Delete data in FK-safe order, then recreate schema
	db.run("PRAGMA foreign_keys = OFF");
	db.run("DELETE FROM card_labels");
	db.run("DELETE FROM cards");
	db.run("DELETE FROM columns");
	db.run("DELETE FROM labels");
	db.run("DELETE FROM boards");
	db.run("DELETE FROM projects");
	db.run("DELETE FROM sessions");
	db.run("DELETE FROM users");
	// Reset autoincrement counters
	db.run("DELETE FROM sqlite_sequence");
	// Rebuild FTS index
	db.run("INSERT INTO cards_fts(cards_fts) VALUES('rebuild')");
	db.run("PRAGMA foreign_keys = ON");

	// Seed test users and sessions
	await seedTestUsers();
}

function generateToken(): string {
	return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
}

async function seedTestUsers(): Promise<void> {
	const db = getDb();
	const expiresAt = new Date(
		Date.now() + 30 * 24 * 60 * 60 * 1000,
	).toISOString();

	// User 1
	const hash1 = await Bun.password.hash(TEST_USER_PASSWORD);
	db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
		TEST_USER_EMAIL,
		hash1,
	]);
	const token1 = generateToken();
	db.run("INSERT INTO sessions (user_id, token, expires_at) VALUES (1, ?, ?)", [
		token1,
		expiresAt,
	]);
	testToken = token1;

	// User 2
	const hash2 = await Bun.password.hash(TEST_USER2_PASSWORD);
	db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
		TEST_USER2_EMAIL,
		hash2,
	]);
	const token2 = generateToken();
	db.run("INSERT INTO sessions (user_id, token, expires_at) VALUES (2, ?, ?)", [
		token2,
		expiresAt,
	]);
	testToken2 = token2;
}

export function getTestToken(): string {
	return testToken;
}

export function getTestToken2(): string {
	return testToken2;
}

export function getTestBaseUrl(): string {
	return baseUrl;
}

/** Make an API request as the second test user */
export function apiAsUser2(
	path: string,
	options: RequestInit = {},
): Promise<Response> {
	const headers = new Headers(options.headers);
	headers.set("Authorization", `Bearer ${testToken2}`);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	return fetch(`${baseUrl}${path}`, { ...options, headers });
}

export function api(
	path: string,
	options: RequestInit = {},
): Promise<Response> {
	const headers = new Headers(options.headers);
	if (!headers.has("Authorization")) {
		headers.set("Authorization", `Bearer ${testToken}`);
	}
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	return fetch(`${baseUrl}${path}`, { ...options, headers });
}

export async function apiJson<T = unknown>(
	res: Response,
): Promise<{ ok: boolean; data: T; error?: string }> {
	return res.json() as Promise<{ ok: boolean; data: T; error?: string }>;
}
