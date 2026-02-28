import type {
  ApiResponse,
  Project,
  Board,
  BoardView,
  Column,
  CardWithLabels,
  Label,
  SearchResult,
} from "../../shared/types.ts";

const API_KEY = "dev-api-key";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data as T;
}

// Projects
export const listProjects = () => request<Project[]>("GET", "/api/projects");
export const createProject = (name: string, description?: string) =>
  request<Project>("POST", "/api/projects", { name, description });
export const deleteProject = (id: number) => request<void>("DELETE", `/api/projects/${id}`);

// Boards
export const listBoards = (projectId: number) => request<Board[]>("GET", `/api/projects/${projectId}/boards`);
export const createBoard = (projectId: number, name: string) =>
  request<Board>("POST", `/api/projects/${projectId}/boards`, { name });
export const getBoard = (id: number) => request<BoardView>("GET", `/api/boards/${id}`);
export const deleteBoard = (id: number) => request<void>("DELETE", `/api/boards/${id}`);

// Columns
export const createColumn = (boardId: number, name: string) =>
  request<Column>("POST", `/api/boards/${boardId}/columns`, { name });
export const updateColumn = (id: number, data: { name?: string }) =>
  request<Column>("PUT", `/api/columns/${id}`, data);
export const deleteColumn = (id: number) => request<void>("DELETE", `/api/columns/${id}`);
export const reorderColumns = (boardId: number, columnIds: number[]) =>
  request<Column[]>("PUT", `/api/boards/${boardId}/columns/reorder`, { column_ids: columnIds });

// Cards
export const createCard = (columnId: number, title: string, description?: string) =>
  request<CardWithLabels>("POST", `/api/columns/${columnId}/cards`, { title, description });
export const updateCard = (id: number, data: Record<string, unknown>) =>
  request<CardWithLabels>("PUT", `/api/cards/${id}`, data);
export const deleteCard = (id: number) => request<void>("DELETE", `/api/cards/${id}`);
export const moveCard = (id: number, columnId: number, position?: number) =>
  request<CardWithLabels>("PUT", `/api/cards/${id}/move`, { column_id: columnId, position });
export const setCardLabels = (id: number, labelIds: number[]) =>
  request<CardWithLabels>("PUT", `/api/cards/${id}/labels`, { label_ids: labelIds });

// Labels
export const listLabels = (projectId: number) => request<Label[]>("GET", `/api/projects/${projectId}/labels`);
export const createLabel = (projectId: number, name: string, colour: string) =>
  request<Label>("POST", `/api/projects/${projectId}/labels`, { name, colour });
export const deleteLabel = (id: number) => request<void>("DELETE", `/api/labels/${id}`);

// Search
export const search = (query: string, projectId?: number) => {
  let path = `/api/search?q=${encodeURIComponent(query)}`;
  if (projectId) path += `&projectId=${projectId}`;
  return request<SearchResult[]>("GET", path);
};
