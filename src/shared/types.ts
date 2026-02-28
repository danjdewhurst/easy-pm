export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  time_estimate: number | null;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  project_id: number;
  name: string;
  colour: string;
  created_at: string;
  updated_at: string;
}

export interface CardLabel {
  card_id: number;
  label_id: number;
}

// Auth types

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  email: string;
  created_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

// API request/response types

export interface CreateProject {
  name: string;
  description?: string | null;
}

export interface UpdateProject {
  name?: string;
  description?: string | null;
}

export interface CreateBoard {
  name: string;
  description?: string | null;
}

export interface UpdateBoard {
  name?: string;
  description?: string | null;
}

export interface CreateColumn {
  name: string;
  position?: number;
}

export interface UpdateColumn {
  name?: string;
  position?: number;
}

export interface ReorderColumns {
  column_ids: number[];
}

export interface CreateCard {
  title: string;
  description?: string | null;
  position?: number;
  due_date?: string | null;
  time_estimate?: number | null;
}

export interface UpdateCard {
  title?: string;
  description?: string | null;
  position?: number;
  due_date?: string | null;
  time_estimate?: number | null;
}

export interface MoveCard {
  column_id: number;
  position?: number;
}

export interface SetCardLabels {
  label_ids: number[];
}

export interface CreateLabel {
  name: string;
  colour: string;
}

export interface UpdateLabel {
  name?: string;
  colour?: string;
}

// Full board view (kanban)
export interface BoardView extends Board {
  columns: ColumnView[];
}

export interface ColumnView extends Column {
  cards: CardWithLabels[];
}

export interface CardWithLabels extends Card {
  labels: Label[];
}

// Search result
export interface SearchResult {
  card: CardWithLabels;
  board_name: string;
  column_name: string;
  project_name: string;
}

// API envelope
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
