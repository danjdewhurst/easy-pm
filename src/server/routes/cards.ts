import { POSITION_GAP } from "../../shared/constants.ts";
import { getDb } from "../../shared/db.ts";
import { ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import type { Card, CardWithLabels, Label } from "../../shared/types.ts";
import {
	parseJsonBody,
	parseTimeEstimate,
	validateDescription,
	validateIntArray,
	validateIsoDate,
	validatePositiveInt,
	validateTitle,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function getUserId(params: Record<string, string>): number {
	return Number(params._userId);
}

function verifyColumnOwnership(
	columnId: string | number,
	userId: number,
): void {
	const db = getDb();
	const row = db
		.query(
			`SELECT p.user_id FROM columns col
       JOIN boards b ON col.board_id = b.id
       JOIN projects p ON b.project_id = p.id
       WHERE col.id = ?`,
		)
		.get(columnId) as { user_id: number } | null;
	if (!row) throw new NotFoundError("Column", columnId);
	if (row.user_id !== userId) throw new ForbiddenError();
}

function verifyCardOwnership(cardId: string | number, userId: number): Card {
	const db = getDb();
	const card = db
		.query("SELECT * FROM cards WHERE id = ?")
		.get(cardId) as Card | null;
	if (!card) throw new NotFoundError("Card", cardId);
	const row = db
		.query(
			`SELECT p.user_id FROM columns col
       JOIN boards b ON col.board_id = b.id
       JOIN projects p ON b.project_id = p.id
       WHERE col.id = ?`,
		)
		.get(card.column_id) as { user_id: number } | null;
	if (!row || row.user_id !== userId) throw new ForbiddenError();
	return card;
}

function getCardWithLabels(cardId: number): CardWithLabels {
	const db = getDb();
	const card = db
		.query("SELECT * FROM cards WHERE id = ?")
		.get(cardId) as Card | null;
	if (!card) throw new NotFoundError("Card", cardId);
	const labels = db
		.query(
			`SELECT l.* FROM labels l
       JOIN card_labels cl ON cl.label_id = l.id
       WHERE cl.card_id = ?
       ORDER BY l.name`,
		)
		.all(cardId) as Label[];
	return { ...card, labels };
}

export function listCards(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	verifyColumnOwnership(params.id!, userId);

	const cards = db
		.query("SELECT * FROM cards WHERE column_id = ? ORDER BY position, id")
		.all(params.id!) as Card[];

	// Batch label fetch to avoid N+1
	const cardIds = cards.map((c) => c.id);
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

	const labelsByCard = new Map<number, Label[]>();
	for (const row of allLabels) {
		const { card_id, ...label } = row;
		if (!labelsByCard.has(card_id)) labelsByCard.set(card_id, []);
		labelsByCard.get(card_id)!.push(label as Label);
	}

	const cardsWithLabels: CardWithLabels[] = cards.map((card) => ({
		...card,
		labels: labelsByCard.get(card.id) ?? [],
	}));

	return jsonResponse(cardsWithLabels);
}

export async function createCard(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	verifyColumnOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const title = validateTitle(body.title);
	const description = validateDescription(body.description) ?? null;
	const due_date = validateIsoDate(body.due_date, "due_date") ?? null;
	const time_estimate = parseTimeEstimate(body.time_estimate);

	let position = validatePositiveInt(body.position, "position");
	if (position === undefined) {
		const last = db
			.query("SELECT MAX(position) as max_pos FROM cards WHERE column_id = ?")
			.get(params.id!) as { max_pos: number | null };
		position = (last.max_pos ?? 0) + POSITION_GAP;
	}

	const result = db
		.query(
			"INSERT INTO cards (column_id, created_by, title, description, position, due_date, time_estimate) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
		)
		.get(
			params.id!,
			userId,
			title,
			description,
			position,
			due_date,
			time_estimate,
		) as Card;

	return jsonResponse({ ...result, labels: [] as Label[] }, 201);
}

export function getCard(
	_req: Request,
	params: Record<string, string>,
): Response {
	const userId = getUserId(params);
	verifyCardOwnership(params.id!, userId);
	return jsonResponse(getCardWithLabels(Number(params.id)));
}

export async function updateCard(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	verifyCardOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const updates: Record<string, unknown> = {};
	if (body.title !== undefined) updates.title = validateTitle(body.title);
	if (body.description !== undefined)
		updates.description = validateDescription(body.description) ?? null;
	if (body.position !== undefined)
		updates.position = validatePositiveInt(body.position, "position");
	if (body.due_date !== undefined)
		updates.due_date = validateIsoDate(body.due_date, "due_date") ?? null;
	if (body.time_estimate !== undefined)
		updates.time_estimate = parseTimeEstimate(body.time_estimate);

	if (Object.keys(updates).length === 0)
		return jsonResponse(getCardWithLabels(Number(params.id)));

	const allowedCols = [
		"title",
		"description",
		"position",
		"due_date",
		"time_estimate",
	] as const;
	const setClauses: string[] = [];
	const allValues: unknown[] = [];
	for (const col of allowedCols) {
		if (col in updates) {
			setClauses.push(`${col} = ?`);
			allValues.push(updates[col]);
		}
	}
	allValues.push(params.id!);

	db.query(
		`UPDATE cards SET ${setClauses.join(", ")}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`,
	).run(...(allValues as [string]));

	return jsonResponse(getCardWithLabels(Number(params.id)));
}

export function deleteCard(
	_req: Request,
	params: Record<string, string>,
): Response {
	const db = getDb();
	const userId = getUserId(params);
	verifyCardOwnership(params.id!, userId);
	db.run("DELETE FROM cards WHERE id = ?", [params.id!]);
	return jsonResponse({ deleted: true });
}

export async function moveCard(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	verifyCardOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const columnId = validatePositiveInt(body.column_id, "column_id");
	if (columnId === undefined) throw new NotFoundError("Column");

	// Verify target column is owned by the same user
	verifyColumnOwnership(columnId, userId);

	let position = validatePositiveInt(body.position, "position");
	if (position === undefined) {
		const last = db
			.query("SELECT MAX(position) as max_pos FROM cards WHERE column_id = ?")
			.get(columnId) as { max_pos: number | null };
		position = (last.max_pos ?? 0) + POSITION_GAP;
	}

	db.query(
		"UPDATE cards SET column_id = ?, position = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
	).run(columnId, position, params.id!);

	return jsonResponse(getCardWithLabels(Number(params.id)));
}

export async function setCardLabels(
	req: Request,
	params: Record<string, string>,
): Promise<Response> {
	const db = getDb();
	const userId = getUserId(params);
	verifyCardOwnership(params.id!, userId);

	const body = await parseJsonBody(req);
	const labelIds = validateIntArray(body.label_ids, "label_ids");

	// Get the project for this card (card -> column -> board -> project)
	const chain = db
		.query(
			`SELECT p.id as project_id FROM cards c
       JOIN columns col ON c.column_id = col.id
       JOIN boards b ON col.board_id = b.id
       JOIN projects p ON b.project_id = p.id
       WHERE c.id = ?`,
		)
		.get(params.id!) as { project_id: number } | null;

	if (!chain) throw new NotFoundError("Card", params.id);

	// Verify all labels belong to the same project
	for (const labelId of labelIds) {
		const label = db
			.query("SELECT * FROM labels WHERE id = ? AND project_id = ?")
			.get(labelId, chain.project_id) as Label | null;
		if (!label) throw new NotFoundError("Label", labelId);
	}

	const tx = db.transaction(() => {
		db.run("DELETE FROM card_labels WHERE card_id = ?", [params.id!]);
		const stmt = db.prepare(
			"INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)",
		);
		for (const labelId of labelIds) {
			stmt.run(params.id!, labelId);
		}
	});
	tx();

	return jsonResponse(getCardWithLabels(Number(params.id)));
}
