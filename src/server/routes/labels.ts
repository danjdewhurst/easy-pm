import { getDb } from "../../shared/db.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { Label } from "../../shared/types.ts";
import { validateName, validateColour, parseJsonBody } from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

export function listLabels(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const project = db.query("SELECT id FROM projects WHERE id = ?").get(params.id!);
  if (!project) throw new NotFoundError("Project", params.id);

  const labels = db.query("SELECT * FROM labels WHERE project_id = ? ORDER BY name").all(params.id!) as Label[];
  return jsonResponse(labels);
}

export async function createLabel(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const project = db.query("SELECT id FROM projects WHERE id = ?").get(params.id!);
  if (!project) throw new NotFoundError("Project", params.id);

  const body = await parseJsonBody(req);
  const name = validateName(body.name);
  const colour = validateColour(body.colour);

  const result = db
    .query("INSERT INTO labels (project_id, name, colour) VALUES (?, ?, ?) RETURNING *")
    .get(params.id!, name, colour) as Label;
  return jsonResponse(result, 201);
}

export async function updateLabel(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const existing = db.query("SELECT * FROM labels WHERE id = ?").get(params.id!) as Label | null;
  if (!existing) throw new NotFoundError("Label", params.id);

  const body = await parseJsonBody(req);
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = validateName(body.name);
  if (body.colour !== undefined) updates.colour = validateColour(body.colour);

  if (Object.keys(updates).length === 0) return jsonResponse(existing);

  const sets = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = [...Object.values(updates), params.id!];

  const updated = db
    .query(`UPDATE labels SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`)
    .get(...(values as [string])) as Label;
  return jsonResponse(updated);
}

export function deleteLabel(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const existing = db.query("SELECT * FROM labels WHERE id = ?").get(params.id!) as Label | null;
  if (!existing) throw new NotFoundError("Label", params.id);
  db.run("DELETE FROM labels WHERE id = ?", [params.id!]);
  return jsonResponse({ deleted: true });
}
