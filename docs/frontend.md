# Frontend

The frontend is a React single-page application served by the same Bun server at `/`. It uses Bun's HTML imports for bundling and Tailwind CSS for styling.

## Stack

- **React 19** with TypeScript
- **Tailwind CSS 4** (imported via `@import "tailwindcss"`)
- **Bun HTML imports** for bundling (no Vite/Webpack)

## Entry Point

The server imports `src/frontend/index.html` and serves it at `/`:

```typescript
import homepage from "../frontend/index.html";

Bun.serve({
  routes: {
    "/": homepage,
  },
  // ...
});
```

`index.html` loads `app.tsx` as a module script. Bun handles TypeScript transpilation, JSX, CSS bundling, and hot module replacement automatically.

## Components

### Root (`app.tsx`)

Top-level component that handles authentication state. On mount, it checks for a stored token in `localStorage` and validates it via `GET /api/auth/me`.

**Auth states**:

| State | Behaviour |
|-------|-----------|
| `loading` | Shows a loading indicator while validating the token |
| `unauthenticated` | Renders `LoginPage` or `RegisterPage` based on the current URL |
| `authenticated` | Renders the main `App` component with user info and logout callback |

On 401 responses, the API client clears the token and redirects to `/login`.

### LoginPage (`components/LoginPage.tsx`)

Email + password form. On success, stores the token and transitions to the authenticated state. Links to the register page.

### RegisterPage (`components/RegisterPage.tsx`)

Email + password + confirm password form. Client-side check that passwords match before submitting. On success, stores the token and transitions to the authenticated state. Links to the login page.

### App (`app.tsx`)

Main application component. Receives the authenticated user and a logout callback as props. Manages global state and renders the layout.

**State**:

| State | Type | Description |
|-------|------|-------------|
| `projects` | `Project[]` | All projects |
| `selectedProject` | `Project \| null` | Currently selected project |
| `boards` | `Board[]` | Boards in the selected project |
| `boardView` | `BoardView \| null` | Active board with columns, cards, labels |
| `labels` | `Label[]` | Labels for the selected project |
| `searchOpen` | `boolean` | Whether the search modal is visible |

**Layout**: Two-column layout — sidebar on the left, main content area on the right. Header bar at the top with the board name and search button.

### Sidebar (`components/Sidebar.tsx`)

Left sidebar with project and board navigation.

**Features**:
- Lists all projects with highlight on the selected one
- "+" button to inline-create a new project (press Enter to submit)
- When a project is selected, shows its boards below
- "+" button to inline-create a new board
- Footer shows the current user's email and a "Sign out" button

### Board (`components/Board.tsx`)

Horizontal kanban board layout.

**Features**:
- Renders columns side by side in a horizontally scrollable container
- "Add column" button at the end with an inline form
- Passes the project's labels down to each column and card

### Column (`components/Column.tsx`)

A single board column.

**Features**:
- Header with column name, card count badge, and delete button
- Vertically scrollable card list with custom scrollbar styling
- "Add card" input at the bottom (auto-hides on blur if empty)
- Delete confirmation dialog

### Card (`components/Card.tsx`)

A card within a column. Clicking opens the detail modal.

**Features**:
- Label chips with per-label colours (semi-transparent background)
- Card title
- Metadata row: due date (formatted), time estimate (in hours/minutes), description indicator
- Hover effect with shadow and border highlight

### CardDetail (`components/CardDetail.tsx`)

Modal for viewing and editing a card.

**Features**:
- Editable title (plain text input)
- Description textarea
- Due date picker (`<input type="date">`)
- Time estimate input (in minutes)
- Label toggles — click to add/remove, visual opacity indicates selection
- Save button (updates card and labels in parallel)
- Delete button with confirmation
- Cancel button / click outside to close
- Modal overlay with backdrop blur

### SearchBar (`components/SearchBar.tsx`)

Full-text search modal.

**Features**:
- Triggered by `Cmd+K` (macOS) / `Ctrl+K` (other) or the search button
- Auto-focuses the input on open
- Debounced search (300ms delay)
- Loading spinner during fetch
- Results show card title, breadcrumb (project → board → column), and label chips
- "No results found" message when query returns empty
- Escape key or click outside to close
- Scoped to the selected project if one is active

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Toggle search |
| `Escape` | Close search |
| `Enter` | Submit inline forms (project, board, column, card creation) |

## API Client (`lib/api.ts`)

Thin wrapper around `fetch()` that handles authentication and the response envelope.

```typescript
async function request<T>(method: string, path: string, body?: unknown): Promise<T>
```

- Reads the auth token from `localStorage` and adds `Authorization: Bearer` header
- On 401 responses: clears the stored token and redirects to `/login`
- Parses the `{ ok, data, error }` envelope
- Throws on `ok: false`
- Returns typed `data` directly

**Auth helpers**: `getToken()`, `setToken()`, `clearToken()` manage the `localStorage` token. Additional API functions: `apiLogin()`, `apiRegister()`, `apiLogout()`, `apiGetMe()`.

All API calls use relative paths (e.g. `/api/projects`) so they work from the same origin as the frontend.

## Routing

The server serves the SPA HTML at `/`, `/login`, `/register`, and `/projects/*`. Client-side routing uses `history.pushState()` and `popstate` events.

| Path | View |
|------|------|
| `/login` | Login page |
| `/register` | Registration page |
| `/` | App root (project/board selection) |
| `/projects/:id` | Project selected |
| `/projects/:id/boards/:id` | Board selected |

## Styling

The app uses CSS custom properties for theming with light and dark modes. See [Design System](design-system.md) for full details.

Custom CSS in `index.css`:
- Thin custom scrollbars for column card lists
- Full-height layout (`html, body, #root { height: 100% }`)
- Plus Jakarta Sans as the body font, Instrument Serif for the brand logotype
