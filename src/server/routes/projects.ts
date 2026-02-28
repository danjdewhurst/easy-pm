import { getDb } from "../../shared/db.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { Project } from "../../shared/types.ts";
import {
	parseJsonBody,
	validateDescription,
	validateName,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

export function listProjects(): Response {
	const db = getDb();
	const projects = db
		.query("SELECT * FROM projects ORDER BY id")
		.all() as Project[];
	return jsonResponse(projects);
}

export async function createProject(req: Request): Promise<Response> {
	const body = await parseJsonBody(req);
	const name = validateName(body.name);
	const description = validateDescription(body.description) ?? null;

	const db = getDb();
	const result = db
		.query("INSERT INTO projects (name, description) VALUES (?, ?) RETURNING *")
		.get(name, description) as Project;
	return jsonResponse(result, 201);
}

export function getProject(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const project = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(params.id!) as Project | null;
	if (!project) throw new NotFoundError("Project", params.id);
	return jsonResponse(project);
}

export async function updateProject(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const existing = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(params.id!) as Project | null;
	if (!existing) throw new NotFoundError("Project", params.id);

	const body = await parseJsonBody(req);
	const updates: Record<string, string | null> = {};
	if (body.name !== undefined) updates.name = validateName(body.name);
	if (body.description !== undefined)
		updates.description = validateDescription(body.description) ?? null;

	if (Object.keys(updates).length === 0) return jsonResponse(existing);

	const sets = Object.keys(updates)
		.map((k) => `${k} = ?`)
		.join(", ");
	const values = [...Object.values(updates), params.id!];

	const updated = db
		.query(
			`UPDATE projects SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`,
		)
		.get(...(values as [string])) as Project;
	return jsonResponse(updated);
}

export function deleteProject(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const existing = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(params.id!) as Project | null;
	if (!existing) throw new NotFoundError("Project", params.id);
	db.run("DELETE FROM projects WHERE id = ?", [params.id!]);
	return jsonResponse({ deleted: true });
}
