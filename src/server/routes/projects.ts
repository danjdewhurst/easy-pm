import { getDb } from "../../shared/db.ts";
import { ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import type { Project } from "../../shared/types.ts";
import {
	parseJsonBody,
	validateDescription,
	validateName,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function getUserId(params: Record<string, string>): number {
	return Number(params._userId);
}

export function listProjects(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	const projects = db
		.query("SELECT * FROM projects WHERE user_id = ? ORDER BY id")
		.all(userId) as Project[];
	return jsonResponse(projects);
}

export async function createProject(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const body = await parseJsonBody(req);
	const name = validateName(body.name);
	const description = validateDescription(body.description) ?? null;
	const userId = getUserId(params);

	const db = getDb();
	const result = db
		.query(
			"INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?) RETURNING *",
		)
		.get(userId, name, description) as Project;
	return jsonResponse(result, 201);
}

export function getProject(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	const project = db
		.query("SELECT * FROM projects WHERE id = ? AND user_id = ?")
		.get(params.id!, userId) as Project | null;
	if (!project) throw new NotFoundError("Project", params.id);
	return jsonResponse(project);
}

export async function updateProject(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	const existing = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(params.id!) as Project | null;
	if (!existing) throw new NotFoundError("Project", params.id);
	if (existing.user_id !== userId) throw new ForbiddenError();

	const body = await parseJsonBody(req);
	const updates: Record<string, string | null> = {};
	if (body.name !== undefined) updates.name = validateName(body.name);
	if (body.description !== undefined)
		updates.description = validateDescription(body.description) ?? null;

	if (Object.keys(updates).length === 0) return jsonResponse(existing);

	const allowedCols = ["name", "description"] as const;
	const setClauses: string[] = [];
	const values: (string | null)[] = [];
	for (const col of allowedCols) {
		if (col in updates) {
			setClauses.push(`${col} = ?`);
			values.push(updates[col]!);
		}
	}
	values.push(params.id!);

	const updated = db
		.query(
			`UPDATE projects SET ${setClauses.join(", ")}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`,
		)
		.get(...(values as [string])) as Project;
	return jsonResponse(updated);
}

export function deleteProject(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	const existing = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(params.id!) as Project | null;
	if (!existing) throw new NotFoundError("Project", params.id);
	if (existing.user_id !== userId) throw new ForbiddenError();
	db.run("DELETE FROM projects WHERE id = ?", [params.id!]);
	return jsonResponse({ deleted: true });
}
