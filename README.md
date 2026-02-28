# easy-pm

A simplified project management tool with three first-class interfaces: REST API, CLI, and React frontend. Built with Bun, SQLite, React, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
bun install

# Start the dev server (with HMR)
bun run dev

# Open in browser
open http://localhost:3000
```

The server exposes both the API (under `/api/`) and the frontend (at `/`).

## Architecture

```
src/
  shared/       # Types, validation, DB schema, error classes
  server/       # Bun.serve() REST API with route handlers
  cli/          # Command-line interface (talks to API over HTTP)
  frontend/     # React + Tailwind single-page app
test/
  server/       # API integration tests
  cli/          # CLI integration tests
```

**Data model**: Projects contain Boards. Boards contain Columns. Columns contain Cards. Labels belong to a Project and can be assigned to any Card within that project.

**Database**: SQLite with WAL mode, foreign keys, CASCADE deletes, and FTS5 full-text search on card titles and descriptions.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `bun run dev` | `bun --hot src/server/index.ts` | Dev server with hot reload |
| `bun run start` | `bun src/server/index.ts` | Production server |
| `bun run cli -- <args>` | `bun src/cli/index.ts` | Run CLI commands |
| `bun test` | `bun test` | Run all tests |
| `bun run typecheck` | `bunx tsc --noEmit` | Type-check the codebase |

## Configuration

Environment variables (Bun loads `.env` automatically):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `EASY_PM_API_URL` | `http://localhost:3000` | CLI: server URL |

## Authentication

The app uses email + password authentication with session tokens. Register an account, then use the returned token for API requests.

**Frontend**: The login/register pages handle auth automatically. Tokens are stored in `localStorage`.

**CLI**:

```bash
# Register a new account
bun run cli -- auth register --email you@example.com --password yourpassword

# Log in (token saved to ~/.config/easy-pm/config.json)
bun run cli -- auth login --email you@example.com --password yourpassword

# All subsequent commands use the stored token
bun run cli -- project list
```

**API**: All routes except `/api/health`, `/api/auth/register`, and `/api/auth/login` require a bearer token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/projects
```

## CLI Usage

```bash
bun run cli -- <resource> <action> [options]
```

**Resources**: `auth`, `project`, `board`, `column`, `card`, `label`, `search`

Examples:

```bash
# Create a project
bun run cli -- project create --name "My Project"

# Create a board
bun run cli -- board create --project-id 1 --name "Sprint 1"

# Add columns
bun run cli -- column create --board-id 1 --name "To Do"
bun run cli -- column create --board-id 1 --name "In Progress"
bun run cli -- column create --board-id 1 --name "Done"

# Add a card
bun run cli -- card create --column-id 1 --title "Build login page" --time-estimate 120

# Move a card
bun run cli -- card move --id 1 --column-id 2

# Search
bun run cli -- search "login" --format json

# JSON output
bun run cli -- project list --format json
```

Global flags: `--format json|table`, `--api-url`, `--token`

## API Overview

All responses follow the envelope: `{ ok: boolean, data?: T, error?: string }`

| Resource | Routes |
|----------|--------|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id` |
| Boards | `GET/POST /api/projects/:id/boards`, `GET/PUT/DELETE /api/boards/:id` |
| Columns | `POST /api/boards/:id/columns`, `PUT/DELETE /api/columns/:id`, `PUT /api/boards/:id/columns/reorder` |
| Cards | `GET/POST /api/columns/:id/cards`, `GET/PUT/DELETE /api/cards/:id`, `PUT /api/cards/:id/move`, `PUT /api/cards/:id/labels` |
| Labels | `GET/POST /api/projects/:id/labels`, `PUT/DELETE /api/labels/:id` |
| Search | `GET /api/search?q=term&projectId=1` |

`GET /api/boards/:id` returns the full board with nested columns, cards, and labels in one request.

## Frontend

The React frontend is served at `/` and provides:

- Sidebar with project and board navigation
- Kanban board with columns and cards
- Inline creation of projects, boards, columns, and cards
- Card detail modal (title, description, due date, time estimate, labels)
- Full-text search with `Cmd+K` / `Ctrl+K`

## Documentation

See the [docs/](docs/) folder for detailed documentation:

- [API Reference](docs/api.md) — full route documentation with request/response examples
- [CLI Reference](docs/cli.md) — all commands, actions, and flags
- [Database](docs/database.md) — schema, FTS5 search, and design decisions
- [Frontend](docs/frontend.md) — components, state management, and keyboard shortcuts
- [Architecture](docs/architecture.md) — project structure, shared layer, and data flow
