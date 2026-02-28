import { getDb } from "../../shared/db.ts";
import { ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import type {
	Board,
	BoardView,
	Card,
	CardWithLabels,
	Column,
	ColumnView,
	Label,
	Project,
} from "../../shared/types.ts";
import {
	parseJsonBody,
	validateDescription,
	validateName,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function getUserId(params: Record<string, string>): number {
	return Number(params._userId);
}

function requireProjectOwnership(
	projectId: string | number,
	userId: number,
): Project {
	const db = getDb();
	const project = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(projectId) as Project | null;
	if (!project) throw new NotFoundError("Project", projectId);
	if (project.user_id !== userId) throw new ForbiddenError();
	return project;
}

function requireBoardOwnership(
	boardId: string | number,
	userId: number,
): Board {
	const db = getDb();
	const board = db
		.query("SELECT * FROM boards WHERE id = ?")
		.get(boardId) as Board | null;
	if (!board) throw new NotFoundError("Board", boardId);
	const project = db
		.query("SELECT * FROM projects WHERE id = ?")
		.get(board.project_id) as Project | null;
	if (!project || project.user_id !== userId) throw new ForbiddenError();
	return board;
}

export function listBoards(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	requireProjectOwnership(params.id!, userId);

	const boards = db
		.query("SELECT * FROM boards WHERE project_id = ? ORDER BY id")
		.all(params.id!) as Board[];
	return jsonResponse(boards);
}

export async function createBoard(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	requireProjectOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const name = validateName(body.name);
	const description = validateDescription(body.description) ?? null;

	const result = db
		.query(
			"INSERT INTO boards (project_id, name, description) VALUES (?, ?, ?) RETURNING *",
		)
		.get(params.id!, name, description) as Board;
	return jsonResponse(result, 201);
}

export function getBoard(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	const board = requireBoardOwnership(params.id!, userId);

	// Fetch all cards for the board in one query (fixes N+1)
	const columns = db
		.query("SELECT * FROM columns WHERE board_id = ? ORDER BY position, id")
		.all(params.id!) as Column[];

	const allCards = db
		.query(
			`SELECT c.* FROM cards c
       JOIN columns col ON c.column_id = col.id
       WHERE col.board_id = ?
       ORDER BY c.position, c.id`,
		)
		.all(params.id!) as Card[];

	const cardIds = allCards.map((c) => c.id);
	let allLabels: (Label & { card_id: number })[] = [];
	if (cardIds.length > 0) {
		const placeholders = cardIds.map(() => "?").join(",");
		allLabels = db
			.query(
				`SELECT l.*, cl.card_id FROM labels l
         JOIN card_labels cl ON cl.label_id = l.id
         WHERE cl.card_id IN (${placeholders})
         ORDER BY l.name`,
			)
			.all(...cardIds) as (Label & { card_id: number })[];
	}

	// Group labels by card_id
	const labelsByCard = new Map<number, Label[]>();
	for (const row of allLabels) {
		const { card_id, ...label } = row;
		if (!labelsByCard.has(card_id)) labelsByCard.set(card_id, []);
		labelsByCard.get(card_id)!.push(label as Label);
	}

	// Group cards by column_id
	const cardsByColumn = new Map<number, CardWithLabels[]>();
	for (const card of allCards) {
		const cardWithLabels: CardWithLabels = {
			...card,
			labels: labelsByCard.get(card.id) ?? [],
		};
		if (!cardsByColumn.has(card.column_id))
			cardsByColumn.set(card.column_id, []);
		cardsByColumn.get(card.column_id)!.push(cardWithLabels);
	}

	const boardView: BoardView = {
		...board,
		columns: columns.map(
			(col): ColumnView => ({
				...col,
				cards: cardsByColumn.get(col.id) ?? [],
			}),
		),
	};

	return jsonResponse(boardView);
}

export async function updateBoard(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	const existing = requireBoardOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const updates: Record<string, unknown> = {};
	if (body.name !== undefined) updates.name = validateName(body.name);
	if (body.description !== undefined)
		updates.description = validateDescription(body.description) ?? null;

	if (Object.keys(updates).length === 0) return jsonResponse(existing);

	const allowedCols = ["name", "description"] as const;
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
			`UPDATE boards SET ${setClauses.join(", ")}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`,
		)
		.get(...(values as [string])) as Board;
	return jsonResponse(updated);
}

export function deleteBoard(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	requireBoardOwnership(params.id!, userId);
	db.run("DELETE FROM boards WHERE id = ?", [params.id!]);
	return jsonResponse({ deleted: true });
}
