<div align="center">

# easy-pm

**A lightweight project management tool with a Kanban board, REST API, and CLI.**

Built with [Bun](https://bun.sh), SQLite, React, and Tailwind CSS.

[![CI](https://github.com/danjdewhurst/easy-pm/actions/workflows/ci.yml/badge.svg)](https://github.com/danjdewhurst/easy-pm/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)

</div>

---

## Features

- **Kanban board** — drag-and-drop cards between columns
- **Three interfaces** — React frontend, REST API, and CLI
- **Full-text search** — FTS5-powered search with `Cmd+K` / `Ctrl+K`
- **Labels & time estimates** — organise and track work
- **Dark mode** — system-aware with manual toggle
- **Zero external services** — SQLite database, no Docker required
- **Auth built in** — email/password with session tokens

## Quick Start

```bash
bun install
bun run dev
# → http://localhost:3000
```

That's it. The server serves both the API (`/api/`) and the frontend (`/`).

## CLI

```bash
bun run cli -- <resource> <action> [options]
```

```bash
# Authenticate
bun run cli -- auth register --email you@example.com --password secret
bun run cli -- auth login --email you@example.com --password secret

# Create a project → board → columns → card
bun run cli -- project create --name "My Project"
bun run cli -- board create --project-id 1 --name "Sprint 1"
bun run cli -- column create --board-id 1 --name "To Do"
bun run cli -- card create --column-id 1 --title "Build login page"

# Move, label, search
bun run cli -- card move --id 1 --column-id 2
bun run cli -- label create --project-id 1 --name "Bug" --colour red
bun run cli -- search "login" --format json
```

Resources: `auth` · `project` · `board` · `column` · `card` · `label` · `search`
Global flags: `--format json|table` · `--api-url` · `--token`

## API

All responses follow `{ ok, data?, error? }`. Auth required via `Authorization: Bearer <token>`.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/register` · `login` · `logout` · `GET /api/auth/me` |
| Projects | `GET/POST /api/projects` · `GET/PUT/DELETE /api/projects/:id` |
| Boards | `GET/POST /api/projects/:id/boards` · `GET/PUT/DELETE /api/boards/:id` |
| Columns | `POST /api/boards/:id/columns` · `PUT/DELETE /api/columns/:id` · `PUT /api/boards/:id/columns/reorder` |
| Cards | `GET/POST /api/columns/:id/cards` · `GET/PUT/DELETE /api/cards/:id` · `PUT /api/cards/:id/move` · `PUT /api/cards/:id/labels` |
| Labels | `GET/POST /api/projects/:id/labels` · `PUT/DELETE /api/labels/:id` |
| Search | `GET /api/search?q=term&projectId=1` |

`GET /api/boards/:id` returns the full board with nested columns, cards, and labels in one request.

## Architecture

```
src/
  shared/       Types, validation, DB schema, error classes
  server/       Bun.serve() REST API
  cli/          CLI (talks to API over HTTP)
  frontend/     React + Tailwind SPA
test/
  server/       API integration tests
  cli/          CLI integration tests
```

**Data model:** Projects → Boards → Columns → Cards. Labels belong to a Project and can be assigned to any Card within it.

**Database:** SQLite with WAL mode, foreign keys, CASCADE deletes, and FTS5 full-text search.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with hot reload |
| `bun run start` | Production server |
| `bun run cli -- <args>` | Run CLI commands |
| `bun test` | Run tests |
| `bun run typecheck` | Type-check the codebase |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `EASY_PM_API_URL` | `http://localhost:3000` | CLI: server URL |

## Documentation

See [`docs/`](docs/) for detailed docs:

[API Reference](docs/api.md) · [CLI Reference](docs/cli.md) · [Database](docs/database.md) · [Frontend](docs/frontend.md) · [Architecture](docs/architecture.md) · [Design System](docs/design-system.md)

## License

[MIT](LICENSE) — Daniel Dewhurst ([@danjdewhurst](https://github.com/danjdewhurst))
