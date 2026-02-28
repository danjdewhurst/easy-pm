import { getDb } from "../../shared/db.ts";
import { ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import type { Label, Project } from "../../shared/types.ts";
import {
	parseJsonBody,
	validateColour,
	validateName,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function getUserId(params: Record<string, string>): number {
	return Number(params._userId);
}

function requireProjectOwnership(
	projectId: string | number,
	userId: number,
): void {
	const db = getDb();
	const project = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(projectId) as Project | null;
	if (!project) throw new NotFoundError("Project", projectId);
	if (project.user_id !== userId) throw new ForbiddenError();
}

function requireLabelOwnership(
	labelId: string | number,
	userId: number,
): Label {
	const db = getDb();
	const label = db
		.query("SELECT * FROM labels WHERE id = ?")
		.get(labelId) as Label | null;
	if (!label) throw new NotFoundError("Label", labelId);
	const project = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(label.project_id) as Project | null;
	if (!project || project.user_id !== userId) throw new ForbiddenError();
	return label;
}

export function listLabels(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	requireProjectOwnership(params.id!, userId);

	const labels = db
		.query("SELECT * FROM labels WHERE project_id = ? ORDER BY name")
		.all(params.id!) as Label[];
	return jsonResponse(labels);
}

export async function createLabel(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	requireProjectOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const name = validateName(body.name);
	const colour = validateColour(body.colour);

	const result = db
		.query(
			"INSERT INTO labels (project_id, name, colour) VALUES (?, ?, ?) RETURNING *",
		)
		.get(params.id!, name, colour) as Label;
	return jsonResponse(result, 201);
}

export async function updateLabel(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	const existing = requireLabelOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const updates: Record<string, unknown> = {};
	if (body.name !== undefined) updates.name = validateName(body.name);
	if (body.colour !== undefined) updates.colour = validateColour(body.colour);

	if (Object.keys(updates).length === 0) return jsonResponse(existing);

	const allowedCols = ["name", "colour"] as const;
	const setClauses: string[] = [];
	const values: unknown[] = [];
	for (const col of allowedCols) {
		if (col in updates) {
			setClauses.push(`${col} = ?`);
			values.push(updates[col]);
		}
	}
	values.push(params.id!);

	const updated = db
		.query(
			`UPDATE labels SET ${setClauses.join(", ")}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`,
		)
		.get(...(values as [string])) as Label;
	return jsonResponse(updated);
}

export function deleteLabel(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	requireLabelOwnership(params.id!, userId);
	db.run("DELETE FROM labels WHERE id = ?", [params.id!]);
	return jsonResponse({ deleted: true });
}
