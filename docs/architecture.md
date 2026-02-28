# Architecture

## Overview

easy-pm is a project management tool with three interfaces that share a common foundation:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Frontend │  │   CLI    │  │  cURL /  │
│ (React)  │  │  (Bun)   │  │ scripts  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     └──────┬──────┴──────────────┘
            │  HTTP (JSON)
     ┌──────┴──────┐
     │  REST API   │
     │ (Bun.serve) │
     └──────┬──────┘
            │
     ┌──────┴──────┐
     │   SQLite    │
     │  (bun:sqlite)│
     └─────────────┘
```

- The **frontend** is served by the same Bun process and makes API calls to the same origin
- The **CLI** connects over HTTP to the running server
- External tools (curl, scripts, AI agents) use the REST API directly

## Project Structure

```
src/
  shared/                  # Code shared across server, CLI, and frontend
    types.ts               # All TypeScript interfaces
    constants.ts           # Limits, defaults, patterns
    errors.ts              # AppError, NotFoundError, ValidationError, AuthError
    schema.ts              # SQL DDL (tables, FTS5, triggers)
    db.ts                  # SQLite singleton
    validate.ts            # Input validation helpers
  server/
    index.ts               # Bun.serve() entry point, route wiring
    middleware.ts           # Auth, error handling, route matching
    routes/
      auth.ts              # Register, login, logout, me
      health.ts            # Health check
      projects.ts          # Project CRUD
      boards.ts            # Board CRUD + full board view
      columns.ts           # Column CRUD + reorder
      cards.ts             # Card CRUD + move + label assignment
      labels.ts            # Label CRUD
      search.ts            # FTS5 search
  cli/
    index.ts               # parseArgs dispatcher
    client.ts              # HTTP client wrapper
    config.ts              # Token storage (~/.config/easy-pm/config.json)
    output.ts              # JSON/table formatters
    commands/
      auth.ts              # auth register|login|logout|whoami
      projects.ts          # project list|create|get|update|delete
      boards.ts            # board list|create|get|update|delete
      columns.ts           # column create|update|delete|reorder
      cards.ts             # card list|create|get|update|delete|move|labels
      labels.ts            # label list|create|update|delete
      search.ts            # search <query>
  frontend/
    index.html             # HTML entry (Bun HTML import)
    index.css              # Tailwind + custom styles
    app.tsx                # React root component
    lib/
      api.ts               # Fetch wrapper with auth
    components/
      LoginPage.tsx         # Login form
      RegisterPage.tsx      # Registration form
      Sidebar.tsx           # Project/board navigation + user/logout
      Board.tsx             # Kanban board layout
      Column.tsx            # Single column with cards
      Card.tsx              # Card preview
      CardDetail.tsx        # Card edit modal
      SearchBar.tsx         # Search modal
test/
  server/
    helpers.ts             # Test server setup/teardown, API helpers
    api.test.ts            # API integration tests (auth, CRUD, search)
  cli/
    cli.test.ts            # CLI integration tests
```

## Data Model

The hierarchy is strictly tree-shaped:

```
Project
  ├── Board
  │     └── Column (ordered by position)
  │           └── Card (ordered by position)
  │                 └── CardLabel (many-to-many)
  └── Label ──────────────────────────────┘
```

- **Projects** are top-level containers
- **Boards** belong to exactly one project
- **Columns** belong to exactly one board and are ordered by `position`
- **Cards** belong to exactly one column and are ordered by `position`
- **Labels** belong to a project and can be assigned to any card within that project via the `card_labels` join table

All parent-child relationships use `ON DELETE CASCADE`.

## Shared Layer

The `src/shared/` directory contains code used by multiple parts of the application:

- **`types.ts`**: TypeScript interfaces for all entities, request/response shapes, and the API envelope. Imported by server routes, CLI commands, and frontend components.
- **`constants.ts`**: Validation limits (`MAX_NAME_LENGTH`, `MAX_TITLE_LENGTH`, etc.), `POSITION_GAP` (1000), and the colour regex pattern.
- **`errors.ts`**: Error class hierarchy. `AppError` is the base; `NotFoundError` (404), `ValidationError` (400), and `AuthError` (401) extend it. The server middleware catches these and returns appropriate HTTP responses.
- **`schema.ts`**: The full SQL DDL as a string. Applied once when the database is first opened.
- **`db.ts`**: Module-scoped singleton pattern. `getDb()` returns (or creates) the connection. `resetDb()` clears the singleton for testing.
- **`validate.ts`**: Pure validation functions that throw `ValidationError` on bad input. Used by route handlers to validate request bodies.

## Server

### Route Matching

Routes are defined as an array of `{ method, pattern, handler, auth }` objects. The `matchRoute()` function performs simple pattern matching:

- Static segments must match exactly
- `:param` segments capture values into a params object
- Patterns and paths must have the same number of segments

Routes are checked in order — the first match wins. The reorder route (`/api/boards/:id/columns/reorder`) is listed before the generic column update route (`/api/columns/:id`) to avoid conflicts.

### Middleware

- **`withAuth`**: Wraps a handler to check the `Authorization: Bearer` token against the `sessions` table (with expiry check). Applied to all routes except health and unauthenticated auth routes (register, login).
- **`jsonResponse`**: Wraps data in the `{ ok: true, data }` envelope.
- **`errorResponse`**: Catches `AppError` subclasses and returns the appropriate status code. Unhandled errors become 500s.

### Error Flow

```
Route handler throws ValidationError("name is required")
  → errorResponse catches AppError
  → Returns 400 { ok: false, error: "name is required" }
```

## CLI

The CLI uses Node's built-in `util.parseArgs` — no external CLI framework.

**Design principles**:
- Talks to the API over HTTP, never to the database directly
- JSON output (`--format json`) returns the raw API envelope for machine consumption
- Table output (`--format table`) formats data for human readability
- Data goes to stdout, errors to stderr
- Exit code 0 on success, 1 on failure

## Frontend

The frontend uses Bun's HTML imports — the server imports `index.html` directly and Bun handles TypeScript transpilation, JSX, CSS bundling (including Tailwind), and HMR.

**Authentication**: A `Root` component wraps the app, checking for a stored token on mount. Unauthenticated users see login/register pages. On successful auth, the token is stored in `localStorage` and the main `App` renders. On 401, the token is cleared and the user is redirected to `/login`.

**State management**: React `useState` + `useCallback` in the `App` component. No external state library. The `onUpdate` callback pattern propagates changes up from child components, triggering a board reload.

**API calls**: All API calls go through `lib/api.ts`, which handles bearer token headers and envelope unwrapping. Calls use relative paths (`/api/...`) so they work on any host.

## Testing

Tests use Bun's built-in test runner (`bun:test`).

**API tests** (`test/server/api.test.ts`):
- Start a test server on a random port with an in-memory SQLite database
- Reset the database between each test (drop + recreate tables) so IDs start from 1
- Use a helper `api()` function that adds auth headers
- Cover all CRUD operations, cascading deletes, search, and auth

**CLI tests** (`test/cli/cli.test.ts`):
- Spawn the CLI as a subprocess pointing at the test server
- Verify JSON output, exit codes, and end-to-end flows

Both test suites share the server setup/teardown helpers in `test/server/helpers.ts`.
