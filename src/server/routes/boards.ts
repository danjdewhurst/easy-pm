import { getDb } from "../../shared/db.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { Board, BoardView, Column, Card, Label, ColumnView, CardWithLabels } from "../../shared/types.ts";
import { validateName, validateDescription, parseJsonBody } from "../../shared/validate.ts";
import { jsonResponse } from "../middleware.ts";

export function listBoards(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  // Verify project exists
  const project = db.query("SELECT id FROM projects WHERE id = ?").get(params.id!);
  if (!project) throw new NotFoundError("Project", params.id);

  const boards = db.query("SELECT * FROM boards WHERE project_id = ? ORDER BY id").all(params.id!) as Board[];
  return jsonResponse(boards);
}

export async function createBoard(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const project = db.query("SELECT id FROM projects WHERE id = ?").get(params.id!);
  if (!project) throw new NotFoundError("Project", params.id);

  const body = await parseJsonBody(req);
  const name = validateName(body.name);
  const description = validateDescription(body.description) ?? null;

  const result = db
    .query("INSERT INTO boards (project_id, name, description) VALUES (?, ?, ?) RETURNING *")
    .get(params.id!, name, description) as Board;
  return jsonResponse(result, 201);
}

export function getBoard(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const board = db.query("SELECT * FROM boards WHERE id = ?").get(params.id!) as Board | null;
  if (!board) throw new NotFoundError("Board", params.id);

  // Full board view: columns + cards + labels
  const columns = db
    .query("SELECT * FROM columns WHERE board_id = ? ORDER BY position, id")
    .all(params.id!) as Column[];

  const boardView: BoardView = {
    ...board,
    columns: columns.map((col): ColumnView => {
      const cards = db
        .query("SELECT * FROM cards WHERE column_id = ? ORDER BY position, id")
        .all(col.id) as Card[];

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

      return { ...col, cards: cardsWithLabels };
    }),
  };

  return jsonResponse(boardView);
}

export async function updateBoard(req: Request, params: Record<string, string>): Promise<Response> {
  const db = getDb();
  const existing = db.query("SELECT * FROM boards WHERE id = ?").get(params.id!) as Board | null;
  if (!existing) throw new NotFoundError("Board", params.id);

  const body = await parseJsonBody(req);
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = validateName(body.name);
  if (body.description !== undefined) updates.description = validateDescription(body.description) ?? null;

  if (Object.keys(updates).length === 0) return jsonResponse(existing);

  const sets = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = [...Object.values(updates), params.id!];

  const updated = db
    .query(`UPDATE boards SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? RETURNING *`)
    .get(...(values as [string])) as Board;
  return jsonResponse(updated);
}

export function deleteBoard(_req: Request, params: Record<string, string>): Response {
  const db = getDb();
  const existing = db.query("SELECT * FROM boards WHERE id = ?").get(params.id!) as Board | null;
  if (!existing) throw new NotFoundError("Board", params.id);
  db.run("DELETE FROM boards WHERE id = ?", [params.id!]);
  return jsonResponse({ deleted: true });
}
