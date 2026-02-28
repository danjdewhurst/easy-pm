import { SESSION_EXPIRY_DAYS } from "../../shared/constants.ts";
import { getDb } from "../../shared/db.ts";
import { AuthError, ValidationError } from "../../shared/errors.ts";
import type {
	AuthResponse,
	PublicUser,
	Session,
	User,
} from "../../shared/types.ts";
import {
	parseJsonBody,
	validateEmail,
	validatePassword,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function generateToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function createSession(userId: number): Session {
	const db = getDb();
	const token = generateToken();
	const expiresAt = new Date(
		Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
	).toISOString();

	db.run("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)", [
		userId,
		token,
		expiresAt,
	]);

	return db
		.query("SELECT * FROM sessions WHERE token = ?")
		.get(token) as Session;
}

function toPublicUser(user: User): PublicUser {
	return { id: user.id, email: user.email, created_at: user.created_at };
}

export async function register(req: Request): Promise<Response> {
	const body = await parseJsonBody(req);
	const email = validateEmail(body.email);
	const password = validatePassword(body.password);

	const db = getDb();

	const existing = db.query("SELECT id FROM users WHERE email = ?").get(email);
	if (existing) {
		throw new ValidationError("A user with this email already exists");
	}

	const passwordHash = await Bun.password.hash(password);
	db.run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
		email,
		passwordHash,
	]);

	const user = db
		.query("SELECT * FROM users WHERE email = ?")
		.get(email) as User;
	const session = createSession(user.id);

	const data: AuthResponse = { token: session.token, user: toPublicUser(user) };
	return jsonResponse(data, 201);
}

export async function login(req: Request): Promise<Response> {
	const body = await parseJsonBody(req);
	const email = validateEmail(body.email);
	const password = validatePassword(body.password);

	const db = getDb();
	const user = db
		.query("SELECT * FROM users WHERE email = ?")
		.get(email) as User | null;

	if (!user || !(await Bun.password.verify(password, user.password_hash))) {
		throw new AuthError("Invalid email or password");
	}

	const session = createSession(user.id);
	const data: AuthResponse = { token: session.token, user: toPublicUser(user) };
	return jsonResponse(data);
}

export function logout(req: Request): Response {
	const token = extractBearerToken(req);
	if (token) {
		const db = getDb();
		db.run("DELETE FROM sessions WHERE token = ?", [token]);
	}
	return jsonResponse({ message: "Logged out" });
}

export function me(req: Request): Response {
	const token = extractBearerToken(req);
	if (!token) throw new AuthError();

	const db = getDb();
	const row = db
		.query(`
    SELECT u.* FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `)
		.get(token) as User | null;

	if (!row) throw new AuthError();
	return jsonResponse(toPublicUser(row));
}

export function extractBearerToken(req: Request): string | null {
	const header = req.headers.get("Authorization");
	if (!header?.startsWith("Bearer ")) return null;
	return header.slice(7);
}
