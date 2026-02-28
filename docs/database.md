# Database

easy-pm uses SQLite as its database, accessed via Bun's built-in `bun:sqlite` module.

## Configuration

- **File**: `easy-pm.db` (created in the working directory on first run)
- **Journal mode**: WAL (Write-Ahead Logging) for concurrent read performance
- **Foreign keys**: Enabled (`PRAGMA foreign_keys = ON`)
- **Tests**: Use `:memory:` databases for isolation

The database is initialised as a singleton via `getDb()` in `src/shared/db.ts`. For file-backed databases, schema changes are applied incrementally via the migration runner. For `:memory:` databases (tests), the full schema string is applied directly.

## Schema

### Entity-Relationship Diagram

```
users
  └── sessions

projects
  ├── boards
  │     └── columns
  │           └── cards ──── card_labels ──── labels
  └── labels ─────────────────────────────────┘
```

All relationships use `ON DELETE CASCADE` — deleting a parent removes all children.

### Tables

#### users

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `email` | TEXT | NOT NULL, UNIQUE |
| `password_hash` | TEXT | NOT NULL (argon2id via `Bun.password.hash()`) |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |

#### sessions

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `user_id` | INTEGER | NOT NULL, FK → users(id) CASCADE |
| `token` | TEXT | NOT NULL, UNIQUE |
| `expires_at` | TEXT | NOT NULL, ISO 8601 |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |

Indexed: `idx_sessions_token` on `token` for fast session lookups.

#### projects

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | Nullable |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |
| `updated_at` | TEXT | NOT NULL, ISO 8601 default |

#### boards

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `project_id` | INTEGER | NOT NULL, FK → projects(id) CASCADE |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | Nullable |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |
| `updated_at` | TEXT | NOT NULL, ISO 8601 default |

#### columns

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `board_id` | INTEGER | NOT NULL, FK → boards(id) CASCADE |
| `name` | TEXT | NOT NULL |
| `position` | INTEGER | NOT NULL, DEFAULT 0 |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |
| `updated_at` | TEXT | NOT NULL, ISO 8601 default |

#### cards

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `column_id` | INTEGER | NOT NULL, FK → columns(id) CASCADE |
| `created_by` | INTEGER | NOT NULL, FK → users(id) |
| `title` | TEXT | NOT NULL |
| `description` | TEXT | Nullable |
| `position` | INTEGER | NOT NULL, DEFAULT 0 |
| `due_date` | TEXT | Nullable, ISO 8601 |
| `time_estimate` | INTEGER | Nullable, in minutes |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |
| `updated_at` | TEXT | NOT NULL, ISO 8601 default |

#### labels

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `project_id` | INTEGER | NOT NULL, FK → projects(id) CASCADE |
| `name` | TEXT | NOT NULL |
| `colour` | TEXT | NOT NULL, hex `#RRGGBB` |
| `created_at` | TEXT | NOT NULL, ISO 8601 default |
| `updated_at` | TEXT | NOT NULL, ISO 8601 default |

#### card_labels

| Column | Type | Constraints |
|--------|------|-------------|
| `card_id` | INTEGER | NOT NULL, FK → cards(id) CASCADE |
| `label_id` | INTEGER | NOT NULL, FK → labels(id) CASCADE |
| | | PRIMARY KEY (card_id, label_id) |

## Full-Text Search (FTS5)

Card titles and descriptions are indexed for full-text search using SQLite's FTS5 extension.

### Virtual Table

```sql
CREATE VIRTUAL TABLE cards_fts USING fts5(
  title,
  description,
  content='cards',
  content_rowid='id'
);
```

The `content=` and `content_rowid=` options make this a "content-sync" table — it mirrors the `cards` table but stores its own inverted index.

### Triggers

Three triggers keep the FTS index in sync:

- **`cards_ai`** (After INSERT): Adds new card to FTS index
- **`cards_au`** (After UPDATE): Removes old entry, inserts updated entry
- **`cards_ad`** (After DELETE): Removes entry from FTS index

The delete syntax uses the special `'delete'` command:

```sql
INSERT INTO cards_fts(cards_fts, rowid, title, description)
  VALUES ('delete', old.id, old.title, old.description);
```

### Query Syntax

FTS5 supports several query forms:

| Query | Matches |
|-------|---------|
| `login` | Cards containing "login" |
| `"login page"` | Cards containing the exact phrase |
| `login AND bug` | Cards containing both terms |
| `login OR signup` | Cards containing either term |
| `auth*` | Prefix match (authentication, authorise, etc.) |
| `login NOT test` | Cards with "login" but not "test" |

Results are ranked by relevance using FTS5's built-in `rank` column.

## Design Decisions

### ISO 8601 Text Dates

Dates are stored as ISO 8601 text (`2026-02-28T12:00:00Z`) rather than Unix timestamps. This makes the database human-readable when inspected directly and avoids timezone conversion issues.

### Position Gaps

Columns and cards use a `position` integer with a default gap of 1000 between items. This allows inserting items between existing ones without reordering the entire list. The reorder endpoint recalculates positions as clean multiples of 1000.

### Cascade Deletes

All foreign keys use `ON DELETE CASCADE`. Deleting a project removes everything beneath it (boards, columns, cards, labels, and card-label assignments). This keeps the database consistent without requiring application-level cleanup.

### Time Estimates in Minutes

Time estimates are stored as integers in minutes. The frontend formats them for display (e.g. `120` → `2h`, `90` → `1h 30m`). Minutes provide enough granularity without the complexity of duration types.

### Application-Level Constraints

The database schema does not enforce length limits — these are validated at the application layer (in `validate.ts` using constants from `constants.ts`):

| Constant | Value | Applies to |
|----------|-------|------------|
| `MAX_NAME_LENGTH` | 255 | Project, board, column, and label names |
| `MAX_TITLE_LENGTH` | 500 | Card titles |
| `MAX_DESCRIPTION_LENGTH` | 5000 | Descriptions |
| `MAX_EMAIL_LENGTH` | 254 | User emails |
| `MIN_PASSWORD_LENGTH` | 8 | User passwords |
| `VALID_COLOUR_PATTERN` | `/^#[0-9a-fA-F]{6}$/` | Label colours |

### Migrations

Schema changes are managed by a lightweight migration runner (`src/shared/migrate.ts`). Migrations are numbered SQL files in the `migrations/` directory:

```
migrations/
  001_initial.sql              # Baseline schema (all tables, indexes, FTS5, triggers)
  002_cards_created_by.sql     # Add created_by column to cards
```

**How it works:**

1. On startup, `getDb()` calls `runMigrations(db)` for file-backed databases
2. The runner creates a `schema_migrations` table if it doesn't exist
3. It reads all `*.sql` files from `migrations/`, sorted by name
4. Already-applied migrations (recorded in `schema_migrations`) are skipped
5. Each new migration runs in its own transaction — if it fails, it's not recorded as applied

**Adding a new migration:**

1. Create `migrations/NNN_description.sql` with the next number
2. Write forward-only SQL (no down migrations)
3. Update `SCHEMA` in `src/shared/schema.ts` to reflect the new canonical state (used by tests)

**Test databases** (`:memory:`) skip the migration runner entirely — they apply the `SCHEMA` string directly, which always represents the current full schema. This avoids file I/O and keeps tests fast.

### Manual `updated_at`

There are no triggers to auto-update the `updated_at` column. Route handlers set it explicitly via `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` when modifying a row.

### Singleton Pattern

The database connection is a module-level singleton (`getDb()`). Two functions manage its lifecycle:

- **`closeDb()`**: Closes the connection and clears the singleton. Used for graceful shutdown.
- **`resetDb()`**: Clears the singleton without closing. Used in tests to swap in a fresh `:memory:` database (the old connection is garbage-collected).
