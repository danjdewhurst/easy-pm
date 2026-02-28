import { getDb } from "../../shared/db.ts";
import { NotFoundError, ValidationError } from "../../shared/errors.ts";
import { POSITION_GAP } from "../../shared/constants.ts";
import type { Column } from "../../shared/types.ts";
import { validateName, validatePositiveInt, validateIntArray, parseJsonBody } from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

export async function createColumn(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const board = db.query("SELECT id FROM boards WHERE id = ?").get(params.id!);
  if (!board) throw new NotFoundError("Board", params.id);

  const body = await parseJsonBody(req);
  const name = validateName(body.name);

  // Default position: after the last column
  let position = validatePositiveInt(body.position, "position");
  if (position === undefined) {
    const last = db
      .query("SELECT MAX(position) as max_pos FROM columns WHERE board_id = ?")
      .get(params.id!) as { max_pos: number | null };
    position = (last.max_pos ?? 0) + POSITION_GAP;
  }

  const result = db
    .query("INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?) RETURNING *")
    .get(params.id!, name, position) as Column;
  return jsonResponse(result, 201);
}

export async function updateColumn(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const existing = db.query("SELECT * FROM columns WHERE id = ?").get(params.id!) as Column | null;
  if (!existing) throw new NotFoundError("Column", params.id);

  const body = await parseJsonBody(req);
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = validateName(body.name);
  if (body.position !== undefined) updates.position = validatePositiveInt(body.position, "position");

  if (Object.keys(updates).length === 0) return jsonResponse(existing);

  const sets = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = [...Object.values(updates), params.id!];

  const updated = db
    .query(`UPDATE columns SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`)
    .get(...(values as [string])) as Column;
  return jsonResponse(updated);
}

export function deleteColumn(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const existing = db.query("SELECT * FROM columns WHERE id = ?").get(params.id!) as Column | null;
  if (!existing) throw new NotFoundError("Column", params.id);
  db.run("DELETE FROM columns WHERE id = ?", [params.id!]);
  return jsonResponse({ deleted: true });
}

export async function reorderColumns(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const board = db.query("SELECT id FROM boards WHERE id = ?").get(params.id!);
  if (!board) throw new NotFoundError("Board", params.id);

  const body = await parseJsonBody(req);
  const columnIds = validateIntArray(body.column_ids, "column_ids");

  if (columnIds.length === 0) {
    throw new ValidationError("column_ids must not be empty");
  }

  // Verify all columns belong to this board
  const existing = db
    .query("SELECT id FROM columns WHERE board_id = ? ORDER BY position, id")
    .all(params.id!) as { id: number }[];
  const existingIds = new Set(existing.map((c) => c.id));

  for (const id of columnIds) {
    if (!existingIds.has(id)) {
      throw new ValidationError(`Column ${id} does not belong to board ${params.id}`);
    }
  }

  // Update positions
  const stmt = db.prepare(
    "UPDATE columns SET position = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
  );
  const tx = db.transaction(() => {
    for (let i = 0; i < columnIds.length; i++) {
      stmt.run((i + 1) * POSITION_GAP, columnIds[i]!);
    }
  });
  tx();

  const columns = db
    .query("SELECT * FROM columns WHERE board_id = ? ORDER BY position, id")
    .all(params.id!) as Column[];
  return jsonResponse(columns);
}
