import type { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve(import.meta.dirname, "../../migrations");

export function runMigrations(db: Database): void {
	db.run(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
		)
	`);

	const applied = new Set(
		db
			.query<{ name: string }, []>("SELECT name FROM schema_migrations")
			.all()
			.map((row) => row.name),
	);

	const files = readdirSync(MIGRATIONS_DIR)
		.filter((f) => f.endsWith(".sql"))
		.sort();

	for (const file of files) {
		if (applied.has(file)) continue;

		const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
		db.transaction(() => {
			db.run(sql);
			db.run("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
		})();
	}
}
