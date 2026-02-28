# CLI Reference

The CLI communicates with the API over HTTP — it does not access the database directly. The server must be running for CLI commands to work.

## Usage

```bash
bun run cli -- <resource> <action> [options]
```

## Global Options

| Flag | Default | Env Variable | Description |
|------|---------|--------------|-------------|
| `--format` | `table` | — | Output format: `json` or `table` |
| `--api-url` | `http://localhost:3000` | `EASY_PM_API_URL` | Server URL |
| `--token` | from config file | — | Auth token (overrides stored token) |
| `--help`, `-h` | — | — | Show usage information |

## Token Storage

The CLI stores your auth token in `~/.config/easy-pm/config.json` after a successful `auth register` or `auth login`. Subsequent commands use this stored token automatically. You can override it with `--token`.

## Output Formats

**`table`** (default): Human-readable table with aligned columns. Objects display as key-value pairs. Complex nested values (arrays, objects) are shown as JSON.

**`json`**: Machine-readable JSON in the API envelope format: `{ "ok": true, "data": ... }`. Suitable for piping to `jq` or parsing programmatically.

Errors are always written to stderr with exit code 1.

---

## Resources

### auth

| Action | Required Flags | Optional Flags |
|--------|---------------|----------------|
| `register` | `--email`, `--password` | — |
| `login` | `--email`, `--password` | — |
| `logout` | — | — |
| `whoami` | — | — |

**Examples**:

```bash
# Register a new account (token saved automatically)
bun run cli -- auth register --email user@example.com --password mypassword

# Log in (token saved automatically)
bun run cli -- auth login --email user@example.com --password mypassword

# Check current user
bun run cli -- auth whoami

# Log out (removes stored token)
bun run cli -- auth logout
```

---

### project

| Action | Required Flags | Optional Flags |
|--------|---------------|----------------|
| `list` | — | — |
| `create` | `--name` | `--description` |
| `get` | `--id` | — |
| `update` | `--id` | `--name`, `--description` |
| `delete` | `--id` | — |

**Examples**:

```bash
# List all projects
bun run cli -- project list

# Create a project
bun run cli -- project create --name "Website Redesign" --description "Q2 initiative"

# Get a project by ID
bun run cli -- project get --id 1

# Update a project
bun run cli -- project update --id 1 --name "Website Redesign v2"

# Delete a project (cascades to all boards, columns, cards)
bun run cli -- project delete --id 1

# JSON output
bun run cli -- project list --format json
```

---

### board

| Action | Required Flags | Optional Flags |
|--------|---------------|----------------|
| `list` | `--project-id` | — |
| `create` | `--project-id`, `--name` | `--description` |
| `get` | `--id` | — |
| `update` | `--id` | `--name`, `--description` |
| `delete` | `--id` | — |

`get` returns the full board view: columns with their cards and labels.

**Examples**:

```bash
# List boards in a project
bun run cli -- board list --project-id 1

# Create a board
bun run cli -- board create --project-id 1 --name "Sprint 1"

# Get full board (columns + cards + labels)
bun run cli -- board get --id 1 --format json
```

---

### column

| Action | Required Flags | Optional Flags |
|--------|---------------|----------------|
| `create` | `--board-id`, `--name` | `--position` |
| `update` | `--id` | `--name`, `--position` |
| `delete` | `--id` | — |
| `reorder` | `--board-id`, `--ids` | — |

**`--ids`**: Comma-separated column IDs in desired order (e.g. `3,1,2`).

**Examples**:

```bash
# Create columns
bun run cli -- column create --board-id 1 --name "To Do"
bun run cli -- column create --board-id 1 --name "In Progress"
bun run cli -- column create --board-id 1 --name "Done"

# Reorder columns (specify IDs in new order)
bun run cli -- column reorder --board-id 1 --ids "3,1,2"

# Update a column name
bun run cli -- column update --id 1 --name "Backlog"

# Delete a column (cascades to cards)
bun run cli -- column delete --id 3
```

---

### card

| Action | Required Flags | Optional Flags |
|--------|---------------|----------------|
| `list` | `--column-id` | — |
| `create` | `--column-id`, `--title` | `--description`, `--due-date`, `--time-estimate`, `--position` |
| `get` | `--id` | — |
| `update` | `--id` | `--title`, `--description`, `--due-date`, `--time-estimate`, `--position` |
| `delete` | `--id` | — |
| `move` | `--id`, `--column-id` | `--position` |
| `labels` | `--id`, `--label-ids` | — |

**`--time-estimate`**: Duration in minutes (e.g. `120` for 2 hours).

**`--due-date`**: ISO 8601 date string (e.g. `2026-03-15`).

**`--label-ids`**: Comma-separated label IDs (e.g. `1,3`). Replaces all existing labels.

**Examples**:

```bash
# List cards in a column
bun run cli -- card list --column-id 1

# Create a card
bun run cli -- card create --column-id 1 --title "Build login page" \
  --description "OAuth + email/password" --time-estimate 120

# Move a card to another column
bun run cli -- card move --id 1 --column-id 2

# Set labels on a card
bun run cli -- card labels --id 1 --label-ids "1,2"

# Update card details
bun run cli -- card update --id 1 --title "Build login page v2" --due-date "2026-04-01"

# Delete a card
bun run cli -- card delete --id 1
```

---

### label

| Action | Required Flags | Optional Flags |
|--------|---------------|----------------|
| `list` | `--project-id` | — |
| `create` | `--project-id`, `--name`, `--colour` | — |
| `update` | `--id` | `--name`, `--colour` |
| `delete` | `--id` | — |

**`--colour`**: Hex colour code (e.g. `#ff0000`).

**Examples**:

```bash
# List labels for a project
bun run cli -- label list --project-id 1

# Create labels
bun run cli -- label create --project-id 1 --name "Bug" --colour "#ff0000"
bun run cli -- label create --project-id 1 --name "Feature" --colour "#00cc88"
bun run cli -- label create --project-id 1 --name "Urgent" --colour "#ff8800"

# Update a label
bun run cli -- label update --id 1 --name "Critical Bug" --colour "#cc0000"

# Delete a label (removes from all cards)
bun run cli -- label delete --id 1
```

---

### search

```bash
bun run cli -- search "<query>" [--project-id <id>]
```

| Positional | Required | Description |
|------------|----------|-------------|
| `<query>` | Yes | Search terms (passed to FTS5) |

| Flag | Required | Description |
|------|----------|-------------|
| `--project-id` | No | Restrict search to a single project |

**Examples**:

```bash
# Search all cards
bun run cli -- search "authentication"

# Search within a project
bun run cli -- search "login bug" --project-id 1

# JSON output for scripting
bun run cli -- search "deploy" --format json
```

---

## AI Agent Integration

The CLI is designed to be AI-agent friendly:

- `--format json` returns structured, parseable output
- The `{ ok, data, error }` envelope makes success/failure detection simple
- Exit code 0 on success, 1 on error
- Errors go to stderr, data to stdout
- All operations are stateless HTTP calls — no session or interactive prompts
