import { Database } from "bun:sqlite";
import { SCHEMA } from "./schema.ts";

let db: Database | null = null;

export function getDb(path = "easy-pm.db"): Database {
	if (!db) {
		db = new Database(path);
		db.run("PRAGMA journal_mode = WAL");
		db.run("PRAGMA foreign_keys = ON");
		db.run(SCHEMA);
	}
	return db;
}

export function closeDb(): void {
	if (db) {
		db.close();
		db = null;
	}
}

/** Reset the singleton — used by tests to swap in a fresh :memory: db */
export function resetDb(): void {
	if (db) {
		db.close();
		db = null;
	}
}
