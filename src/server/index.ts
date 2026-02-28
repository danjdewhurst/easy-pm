import { DEFAULT_PORT } from "../shared/constants.ts";
import { withAuth, errorResponse, matchRoute } from "./middleware.ts";
import { handleHealth } from "./routes/health.ts";
import { listProjects, createProject, getProject, updateProject, deleteProject } from "./routes/projects.ts";
import { listBoards, createBoard, getBoard, updateBoard, deleteBoard } from "./routes/boards.ts";
import { createColumn, updateColumn, deleteColumn, reorderColumns } from "./routes/columns.ts";
import { listCards, createCard, getCard, updateCard, deleteCard, moveCard, setCardLabels } from "./routes/cards.ts";
import { listLabels, createLabel, updateLabel, deleteLabel } from "./routes/labels.ts";
import { searchCards } from "./routes/search.ts";
import homepage from "../frontend/index.html";

type RouteHandler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: string;
  handler: RouteHandler;
  auth: boolean;
}

const routes: Route[] = [
  // Health (no auth)
  { method: "GET", pattern: "/api/health", handler: handleHealth as RouteHandler, auth: false },

  // Projects
  { method: "GET", pattern: "/api/projects", handler: listProjects as RouteHandler, auth: true },
  { method: "POST", pattern: "/api/projects", handler: createProject as RouteHandler, auth: true },
  { method: "GET", pattern: "/api/projects/:id", handler: getProject, auth: true },
  { method: "PUT", pattern: "/api/projects/:id", handler: updateProject, auth: true },
  { method: "DELETE", pattern: "/api/projects/:id", handler: deleteProject, auth: true },

  // Boards
  { method: "GET", pattern: "/api/projects/:id/boards", handler: listBoards, auth: true },
  { method: "POST", pattern: "/api/projects/:id/boards", handler: createBoard, auth: true },
  { method: "GET", pattern: "/api/boards/:id", handler: getBoard, auth: true },
  { method: "PUT", pattern: "/api/boards/:id", handler: updateBoard, auth: true },
  { method: "DELETE", pattern: "/api/boards/:id", handler: deleteBoard, auth: true },

  // Columns
  { method: "POST", pattern: "/api/boards/:id/columns", handler: createColumn, auth: true },
  { method: "PUT", pattern: "/api/boards/:id/columns/reorder", handler: reorderColumns, auth: true },
  { method: "PUT", pattern: "/api/columns/:id", handler: updateColumn, auth: true },
  { method: "DELETE", pattern: "/api/columns/:id", handler: deleteColumn, auth: true },

  // Cards
  { method: "GET", pattern: "/api/columns/:id/cards", handler: listCards, auth: true },
  { method: "POST", pattern: "/api/columns/:id/cards", handler: createCard, auth: true },
  { method: "GET", pattern: "/api/cards/:id", handler: getCard, auth: true },
  { method: "PUT", pattern: "/api/cards/:id", handler: updateCard, auth: true },
  { method: "DELETE", pattern: "/api/cards/:id", handler: deleteCard, auth: true },
  { method: "PUT", pattern: "/api/cards/:id/move", handler: moveCard, auth: true },
  { method: "PUT", pattern: "/api/cards/:id/labels", handler: setCardLabels, auth: true },

  // Labels
  { method: "GET", pattern: "/api/projects/:id/labels", handler: listLabels, auth: true },
  { method: "POST", pattern: "/api/projects/:id/labels", handler: createLabel, auth: true },
  { method: "PUT", pattern: "/api/labels/:id", handler: updateLabel, auth: true },
  { method: "DELETE", pattern: "/api/labels/:id", handler: deleteLabel, auth: true },

  // Search
  { method: "GET", pattern: "/api/search", handler: searchCards as RouteHandler, auth: true },
];

function handleRequest(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;

  for (const route of routes) {
    if (route.method !== method) continue;
    const params = matchRoute(url.pathname, route.pattern);
    if (params === null) continue;

    const handler = route.auth ? withAuth(route.handler) : route.handler;
    return handler(req, params);
  }


  return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

export function createServer(port?: number) {
  const p = port ?? (Number(process.env["PORT"]) || DEFAULT_PORT);
  return Bun.serve({
    port: p,
    routes: {
      "/": homepage,
      "/projects/*": homepage,
    },
    async fetch(req) {
      try {
        return await handleRequest(req);
      } catch (error) {
        return errorResponse(error);
      }
    },
    development: {
      hmr: true,
      console: true,
    },
  });
}

// Auto-start when run directly
if (import.meta.main) {
  const server = createServer();
  console.log(`easy-pm server running on http://localhost:${server.port}`);
}
