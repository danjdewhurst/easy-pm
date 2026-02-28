import { getDb } from "../../shared/db.ts";
import { ValidationError } from "../../shared/errors.ts";
import type { Card, Label, SearchResult } from "../../shared/types.ts";
import { jsonResponse } from "../middleware.ts";

function getUserId(params: Record<string, string>): number {
	return Number(params._userId);
}

/** Escape FTS5 special characters by wrapping each term in double quotes */
function sanitiseFtsQuery(raw: string): string {
	return raw
		.trim()
		.split(/\s+/)
		.map((term) => `"${term.replace(/"/g, '""')}"`)
		.join(" ");
}

export function searchCards(
	req: Request,
	params: Record<string, string>,
): Response {
	const url = new URL(req.url);
	const q = url.searchParams.get("q");
	if (!q || q.trim().length === 0) {
		throw new ValidationError("Search query 'q' is required");
	}

	const userId = getUserId(params);
	const projectId = url.searchParams.get("projectId");
	const safeQuery = sanitiseFtsQuery(q);

	const db = getDb();

	let sql = `
    SELECT c.*, col.name as column_name, b.name as board_name, p.name as project_name
    FROM cards_fts fts
    JOIN cards c ON c.id = fts.rowid
    JOIN columns col ON c.column_id = col.id
    JOIN boards b ON col.board_id = b.id
    JOIN projects p ON b.project_id = p.id
    WHERE cards_fts MATCH ?
    AND p.user_id = ?
  `;
	const sqlParams: (string | number)[] = [safeQuery, userId];

	if (projectId) {
		sql += " AND p.id = ?";
		sqlParams.push(projectId);
	}

	sql += " ORDER BY rank LIMIT 50";

	type SearchRow = Card & {
		column_name: string;
		board_name: string;
		project_name: string;
	};
	const rows = db.query(sql).all(...sqlParams) as SearchRow[];

	const results: SearchResult[] = rows.map((row) => {
		const labels = db
			.query(
				`SELECT l.* FROM labels l
         JOIN card_labels cl ON cl.label_id = l.id
         WHERE cl.card_id = ?
         ORDER BY l.name`,
			)
			.all(row.id) as Label[];

		const { column_name, board_name, project_name, ...card } = row;
		return {
			card: { ...card, labels },
			column_name,
			board_name,
			project_name,
		};
	});

	return jsonResponse(results);
}
