import { getDb } from "../../shared/db.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { POSITION_GAP } from "../../shared/constants.ts";
import type { Card, CardWithLabels, Label } from "../../shared/types.ts";
import {
  validateTitle,
  validateDescription,
  validatePositiveInt,
  validateIsoDate,
  validateIntArray,
  parseJsonBody,
  parseTimeEstimate,
} from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

function getCardWithLabels(cardId: number): CardWithLabels {
  const db = getDb();
  const card = db.query("SELECT * FROM cards WHERE id = ?").get(cardId) as Card | null;
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

export function listCards(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const column = db.query("SELECT id FROM columns WHERE id = ?").get(params.id!);
  if (!column) throw new NotFoundError("Column", params.id);

  const cards = db
    .query("SELECT * FROM cards WHERE column_id = ? ORDER BY position, id")
    .all(params.id!) as Card[];

  const cardsWithLabels: CardWithLabels[] = cards.map((card) => {
    const labels = db
      .query(
        `SELECT l.* FROM labels l
         JOIN card_labels cl ON cl.label_id = l.id
         WHERE cl.card_id = ?
         ORDER BY l.name`,
      )
      .all(card.id) as Label[];
    return { ...card, labels };
  });

  return jsonResponse(cardsWithLabels);
}

export async function createCard(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const column = db.query("SELECT id FROM columns WHERE id = ?").get(params.id!);
  if (!column) throw new NotFoundError("Column", params.id);

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
      "INSERT INTO cards (column_id, title, description, position, due_date, time_estimate) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .get(params.id!, title, description, position, due_date, time_estimate) as Card;

  return jsonResponse({ ...result, labels: [] as Label[] }, 201);
}

export function getCard(_req: Request, params: Record<string, string>): Response {
  return jsonResponse(getCardWithLabels(Number(params.id)));
}

export async function updateCard(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const existing = db.query("SELECT * FROM cards WHERE id = ?").get(params.id!) as Card | null;
  if (!existing) throw new NotFoundError("Card", params.id);

  const body = await parseJsonBody(req);
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = validateTitle(body.title);
  if (body.description !== undefined) updates.description = validateDescription(body.description) ?? null;
  if (body.position !== undefined) updates.position = validatePositiveInt(body.position, "position");
  if (body.due_date !== undefined) updates.due_date = validateIsoDate(body.due_date, "due_date") ?? null;
  if (body.time_estimate !== undefined)
    updates.time_estimate = parseTimeEstimate(body.time_estimate);

  if (Object.keys(updates).length === 0) return jsonResponse(getCardWithLabels(Number(params.id)));

  const sets = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const allValues = [...Object.values(updates), params.id!];
  db.query(`UPDATE cards SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`).run(
    ...(allValues as [string]),
  );

  return jsonResponse(getCardWithLabels(Number(params.id)));
}

export function deleteCard(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const existing = db.query("SELECT * FROM cards WHERE id = ?").get(params.id!) as Card | null;
  if (!existing) throw new NotFoundError("Card", params.id);
  db.run("DELETE FROM cards WHERE id = ?", [params.id!]);
  return jsonResponse({ deleted: true });
}

export async function moveCard(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const existing = db.query("SELECT * FROM cards WHERE id = ?").get(params.id!) as Card | null;
  if (!existing) throw new NotFoundError("Card", params.id);

  const body = await parseJsonBody(req);
  const columnId = validatePositiveInt(body.column_id, "column_id");
  if (columnId === undefined) throw new NotFoundError("Column");

  const column = db.query("SELECT id FROM columns WHERE id = ?").get(columnId);
  if (!column) throw new NotFoundError("Column", columnId);

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

export async function setCardLabels(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const existing = db.query("SELECT * FROM cards WHERE id = ?").get(params.id!) as Card | null;
  if (!existing) throw new NotFoundError("Card", params.id);

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
    const stmt = db.prepare("INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)");
    for (const labelId of labelIds) {
      stmt.run(params.id!, labelId);
    }
  });
  tx();

  return jsonResponse(getCardWithLabels(Number(params.id)));
}
