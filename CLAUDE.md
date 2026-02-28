# Easy-PM

Lightweight project management tool with Kanban boards. Three interfaces: React web frontend, REST API, and CLI.

## Stack

- **Runtime:** Bun (TypeScript) — no Node.js, no Express
- **Database:** SQLite via `bun:sqlite` (WAL mode, FTS5 for search)
- **Frontend:** React 19 + Tailwind CSS v4 (Catppuccin Latte/Frappé colour system)
- **Linting:** Biome (tabs, double quotes, recommended rules)
- **Git hooks:** Lefthook (pre-commit: biome check + tsc --noEmit)

## Commands

```sh
bun install            # install dependencies
bun run dev            # dev server with HMR (port 3000)
bun run start          # production server
bun run cli -- <args>  # CLI (e.g. bun run cli -- card list --board-id 1)
bun test               # run all tests
bun run typecheck      # type-check
bun run lint           # lint with Biome
bun run lint:fix       # auto-fix lint issues
bun run format         # format with Biome
```

## Architecture

```
src/
  shared/          # Types, validation, DB schema, errors, constants
  server/          # Bun.serve() API + frontend serving
    routes/        # auth, projects, boards, columns, cards, labels, search
  cli/             # CLI entry point + commands (mirrors API resources)
    commands/      # auth, projects, boards, columns, cards, labels, search
  frontend/        # React SPA served via HTML imports
    components/    # Board, Column, Card, CardDetail, Sidebar, SearchBar, etc.
test/
  server/          # API integration tests
  cli/             # CLI integration tests
  shared/          # Validation unit tests
```

## Data Model

User → Projects → Boards → Columns → Cards ↔ Labels (join table). Labels are scoped to a project. Columns and cards use `position` (integer, gap of 1000) for drag-and-drop ordering. FTS5 virtual table indexes card title + description with triggers for sync.

## Key Patterns

- **Auth:** Bearer token sessions (30-day expiry), IP-based rate limiting on auth endpoints
- **Ownership:** Multi-layer verification (user → project → board → column → card) on every mutation
- **Errors:** Domain-specific hierarchy (`AppError`, `NotFoundError`, `ValidationError`, `ForbiddenError`) — throw in handlers, caught by middleware
- **Validation:** Centralised in `src/shared/validate.ts` — all input validated before DB access
- **API responses:** Envelope format `{ ok: boolean, data?: T, error?: string }`
- **DB queries:** Direct parameterised SQLite, batch queries to avoid N+1
- **Frontend routing:** History API with manual route matching in `App.tsx`
- **Colour system:** CSS custom properties (`--surface-0` through `--surface-3`, `--text-primary`, `--accent`, etc.) with light/dark mode

## Conventions

- British English spelling (`colour`, `initialise`, `organised`)
- Strict TypeScript — no `any`, explicit types
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`)
- Tests use in-memory SQLite with `setupTestServer()`/`teardownTestServer()` helpers
