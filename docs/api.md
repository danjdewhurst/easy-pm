# API Reference

Base URL: `http://localhost:3000/api`

## Authentication

The API uses bearer token authentication. Register or log in to obtain a session token, then include it in the `Authorization` header:

```
Authorization: Bearer <token>
```

Routes that do **not** require authentication: `/api/health`, `/api/auth/register`, `/api/auth/login`.

All other routes return 401 without a valid token:

```json
{ "ok": false, "error": "Unauthorised" }
```

Tokens are 64-character hex strings with a 30-day expiry. Passwords are hashed with argon2id via `Bun.password.hash()`.

## Response Envelope

Every response follows this shape:

```json
{
  "ok": true,
  "data": { ... }
}
```

On error:

```json
{
  "ok": false,
  "error": "Description of the problem"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorised (missing or invalid token, wrong credentials) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Health

### `GET /api/health`

No authentication required.

**Response (200)**:

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-02-28T12:00:00.000Z"
  }
}
```

---

## Auth

### `POST /api/auth/register`

Create a new user account and return a session token. No authentication required.

**Request body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email, max 254 characters, must be unique |
| `password` | string | Yes | At least 8 characters |

**Response (201)**:

```json
{
  "ok": true,
  "data": {
    "token": "a1b2c3...64-char-hex",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "created_at": "2026-02-28T12:00:00Z"
    }
  }
}
```

### `POST /api/auth/login`

Authenticate with email and password. No authentication required.

**Request body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200)**: Same shape as register — `{ token, user }`.

Returns 401 if the email doesn't exist or the password is wrong.

### `POST /api/auth/logout`

Invalidate the current session token. Requires authentication.

**Response (200)**:

```json
{ "ok": true, "data": { "message": "Logged out" } }
```

### `GET /api/auth/me`

Return the currently authenticated user. Requires authentication.

**Response (200)**:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2026-02-28T12:00:00Z"
  }
}
```

---

## Projects

### `GET /api/projects`

List all projects.

**Response (200)**:

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "My Project",
      "description": "Optional description",
      "created_at": "2026-02-28T12:00:00Z",
      "updated_at": "2026-02-28T12:00:00Z"
    }
  ]
}
```

### `POST /api/projects`

Create a project.

**Request body**:

```json
{
  "name": "My Project",
  "description": "Optional description"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–255 characters |
| `description` | string \| null | No | Max 5000 characters |

**Response (201)**: The created project object.

### `GET /api/projects/:id`

Get a single project.

**Response (200)**: Project object.

### `PUT /api/projects/:id`

Update a project. Only include the fields you want to change.

**Request body**:

```json
{
  "name": "New Name",
  "description": null
}
```

**Response (200)**: The updated project object.

### `DELETE /api/projects/:id`

Delete a project. Cascades to all boards, columns, cards, labels, and card-label assignments.

**Response (200)**:

```json
{ "ok": true, "data": { "deleted": true } }
```

---

## Boards

### `GET /api/projects/:id/boards`

List all boards for a project.

**Response (200)**: Array of board objects.

### `POST /api/projects/:id/boards`

Create a board within a project.

**Request body**:

```json
{
  "name": "Sprint 1",
  "description": "Optional"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–255 characters |
| `description` | string \| null | No | Max 5000 characters |

**Response (201)**: The created board object.

### `GET /api/boards/:id`

Get a board with its full hierarchy: columns (ordered by position), cards in each column (ordered by position), and labels on each card. This is the "kanban view" endpoint.

**Response (200)**:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "Sprint 1",
    "description": null,
    "created_at": "2026-02-28T12:00:00Z",
    "updated_at": "2026-02-28T12:00:00Z",
    "columns": [
      {
        "id": 1,
        "board_id": 1,
        "name": "To Do",
        "position": 1000,
        "created_at": "...",
        "updated_at": "...",
        "cards": [
          {
            "id": 1,
            "column_id": 1,
            "title": "Fix login bug",
            "description": "Users can't log in on mobile",
            "position": 1000,
            "due_date": "2026-03-15T00:00:00.000Z",
            "time_estimate": 120,
            "created_at": "...",
            "updated_at": "...",
            "labels": [
              {
                "id": 1,
                "project_id": 1,
                "name": "Bug",
                "colour": "#ff0000",
                "created_at": "...",
                "updated_at": "..."
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### `PUT /api/boards/:id`

Update a board's name or description.

**Response (200)**: The updated board object.

### `DELETE /api/boards/:id`

Delete a board. Cascades to columns, cards, and card-label assignments.

**Response (200)**: `{ "ok": true, "data": { "deleted": true } }`

---

## Columns

### `POST /api/boards/:id/columns`

Create a column within a board.

**Request body**:

```json
{
  "name": "In Progress",
  "position": 2000
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–255 characters |
| `position` | integer | No | Non-negative. Defaults to last position + 1000 |

**Response (201)**: The created column object.

### `PUT /api/columns/:id`

Update a column's name or position.

**Response (200)**: The updated column object.

### `DELETE /api/columns/:id`

Delete a column. Cascades to all cards within it.

**Response (200)**: `{ "ok": true, "data": { "deleted": true } }`

### `PUT /api/boards/:id/columns/reorder`

Reorder all columns in a board. Provide the column IDs in the desired order.

**Request body**:

```json
{
  "column_ids": [3, 1, 2]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `column_ids` | integer[] | Yes | Non-empty. All IDs must belong to the specified board |

Positions are recalculated as multiples of 1000 (1000, 2000, 3000, ...).

**Response (200)**: Array of updated column objects in new order.

---

## Cards

### `GET /api/columns/:id/cards`

List all cards in a column, ordered by position. Each card includes its labels.

**Response (200)**: Array of card objects with `labels` array.

### `POST /api/columns/:id/cards`

Create a card within a column.

**Request body**:

```json
{
  "title": "Implement search",
  "description": "Add FTS5 full-text search",
  "due_date": "2026-03-15T00:00:00.000Z",
  "time_estimate": 90,
  "position": 1000
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1–500 characters |
| `description` | string \| null | No | Max 5000 characters |
| `due_date` | string \| null | No | Valid ISO 8601 date |
| `time_estimate` | integer \| null | No | Non-negative, in minutes |
| `position` | integer | No | Non-negative. Defaults to last + 1000 |

**Response (201)**: Card object with empty `labels` array.

### `GET /api/cards/:id`

Get a single card with its labels.

**Response (200)**: Card object with `labels` array.

### `PUT /api/cards/:id`

Update a card. Only include fields you want to change. Set a field to `null` to clear it.

**Response (200)**: Updated card object with `labels` array.

### `DELETE /api/cards/:id`

Delete a card.

**Response (200)**: `{ "ok": true, "data": { "deleted": true } }`

### `PUT /api/cards/:id/move`

Move a card to a different column (or reposition within the same column).

**Request body**:

```json
{
  "column_id": 2,
  "position": 1500
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `column_id` | integer | Yes | Must be a valid column ID |
| `position` | integer | No | Defaults to end of target column |

**Response (200)**: Updated card object with `labels` array.

### `PUT /api/cards/:id/labels`

Set the labels on a card. Replaces all existing label assignments.

**Request body**:

```json
{
  "label_ids": [1, 3]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `label_ids` | integer[] | Yes | All labels must belong to the same project as the card |

Pass an empty array to remove all labels.

**Response (200)**: Updated card object with `labels` array.

---

## Labels

Labels are scoped to a project and can be assigned to any card within that project.

### `GET /api/projects/:id/labels`

List all labels for a project, ordered by name.

**Response (200)**: Array of label objects.

### `POST /api/projects/:id/labels`

Create a label within a project.

**Request body**:

```json
{
  "name": "Bug",
  "colour": "#ff0000"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–255 characters |
| `colour` | string | Yes | Hex format `#RRGGBB` (e.g. `#ff0000`) |

**Response (201)**: The created label object.

### `PUT /api/labels/:id`

Update a label's name or colour.

**Response (200)**: The updated label object.

### `DELETE /api/labels/:id`

Delete a label. Removes it from all cards.

**Response (200)**: `{ "ok": true, "data": { "deleted": true } }`

---

## Search

### `GET /api/search?q=term&projectId=1`

Full-text search across card titles and descriptions using SQLite FTS5.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `projectId` | integer | No | Filter results to a single project |

Returns up to 50 results, ranked by relevance.

**Response (200)**:

```json
{
  "ok": true,
  "data": [
    {
      "card": {
        "id": 1,
        "column_id": 1,
        "title": "Fix authentication bug",
        "description": "Users cannot log in",
        "position": 1000,
        "due_date": null,
        "time_estimate": null,
        "created_at": "...",
        "updated_at": "...",
        "labels": []
      },
      "column_name": "To Do",
      "board_name": "Sprint 1",
      "project_name": "My Project"
    }
  ]
}
```

The search query is passed directly to FTS5's `MATCH` operator. FTS5 supports:

- Simple terms: `login`
- Phrases: `"login page"`
- Boolean operators: `login AND bug`
- Prefix matching: `auth*`
