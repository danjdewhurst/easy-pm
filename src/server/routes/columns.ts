import { POSITION_GAP } from "../../shared/constants.ts";
import { getDb } from "../../shared/db.ts";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../shared/errors.ts";
import type { Column } from "../../shared/types.ts";
import {
	parseJsonBody,
	validateIntArray,
	validateName,
	validatePositiveInt,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function getUserId(params: Record<string, string>): number {
	return Number(params._userId);
}

function requireBoardOwnership(boardId: string | number, userId: number): void {
	const db = getDb();
	const row = db
		.query(
			`SELECT p.user_id FROM boards b
       JOIN projects p ON b.project_id = p.id
       WHERE b.id = ?`,
		)
		.get(boardId) as { user_id: number } | null;
	if (!row) throw new NotFoundError("Board", boardId);
	if (row.user_id !== userId) throw new ForbiddenError();
}

function requireColumnOwnership(
	columnId: string | number,
	userId: number,
): Column {
	const db = getDb();
	const col = db
		.query("SELECT * FROM columns WHERE id = ?")
		.get(columnId) as Column | null;
	if (!col) throw new NotFoundError("Column", columnId);
	const row = db
		.query(
			`SELECT p.user_id FROM boards b
       JOIN projects p ON b.project_id = p.id
       WHERE b.id = ?`,
		)
		.get(col.board_id) as { user_id: number } | null;
	if (!row || row.user_id !== userId) throw new ForbiddenError();
	return col;
}

export async function createColumn(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	requireBoardOwnership(params.id!, userId);

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
		.query(
			"INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?) RETURNING *",
		)
		.get(params.id!, name, position) as Column;
	return jsonResponse(result, 201);
}

export async function updateColumn(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	const existing = requireColumnOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const updates: Record<string, unknown> = {};
	if (body.name !== undefined) updates.name = validateName(body.name);
	if (body.position !== undefined)
		updates.position = validatePositiveInt(body.position, "position");

	if (Object.keys(updates).length === 0) return jsonResponse(existing);

	const allowedCols = ["name", "position"] as const;
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
			`UPDATE columns SET ${setClauses.join(", ")}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`,
		)
		.get(...(values as [string])) as Column;
	return jsonResponse(updated);
}

export function deleteColumn(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	requireColumnOwnership(params.id!, userId);
	db.run("DELETE FROM columns WHERE id = ?", [params.id!]);
	return jsonResponse({ deleted: true });
}

export async function reorderColumns(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	requireBoardOwnership(params.id!, userId);

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
			throw new ValidationError(
				`Column ${id} does not belong to board ${params.id}`,
			);
		}
	}

	// Verify all board columns are included
	if (columnIds.length !== existing.length) {
		throw new ValidationError(
			"column_ids must include all columns in the board",
		);
	}
	const providedIds = new Set(columnIds);
	for (const { id } of existing) {
		if (!providedIds.has(id)) {
			throw new ValidationError(
				`column_ids is missing column ${id} from the board`,
			);
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
