import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import type { Project, Board as BoardType, BoardView, Label } from "../shared/types.ts";
import * as api from "./lib/api.ts";
import { Sidebar } from "./components/Sidebar.tsx";
import { BoardComponent } from "./components/Board.tsx";
import { SearchBar } from "./components/SearchBar.tsx";

function parseRoute(): { projectId?: number; boardId?: number } {
  const match = window.location.pathname.match(
    /^\/projects\/(\d+)(?:\/boards\/(\d+))?/
  );
  if (!match) return {};
  return {
    projectId: Number(match[1]),
    boardId: match[2] ? Number(match[2]) : undefined,
  };
}

function buildPath(projectId?: number, boardId?: number): string {
  if (projectId && boardId) return `/projects/${projectId}/boards/${boardId}`;
  if (projectId) return `/projects/${projectId}`;
  return "/";
}

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [boardView, setBoardView] = useState<BoardView | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const loadProjects = useCallback(async () => {
    const data = await api.listProjects();
    setProjects(data);
    return data;
  }, []);

  const loadBoards = useCallback(async (projectId: number) => {
    const data = await api.listBoards(projectId);
    setBoards(data);
  }, []);

  const loadBoard = useCallback(async (boardId: number) => {
    const data = await api.getBoard(boardId);
    setBoardView(data);
  }, []);

  const loadLabels = useCallback(async (projectId: number) => {
    const data = await api.listLabels(projectId);
    setLabels(data);
  }, []);

  // Restore state from URL on initial load
  useEffect(() => {
    (async () => {
      const allProjects = await loadProjects();
      const { projectId, boardId } = parseRoute();
      if (projectId) {
        const project = allProjects.find((p: Project) => p.id === projectId);
        if (project) {
          setSelectedProject(project);
          if (boardId) loadBoard(boardId);
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedProject) {
      loadBoards(selectedProject.id);
      loadLabels(selectedProject.id);
    }
  }, [selectedProject, loadBoards, loadLabels]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const { projectId, boardId } = parseRoute();
      if (!projectId) {
        setSelectedProject(null);
        setBoardView(null);
        setBoards([]);
        return;
      }
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        if (boardId) {
          loadBoard(boardId);
        } else {
          setBoardView(null);
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [projects, loadBoard]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setBoardView(null);
    history.pushState(null, "", buildPath(project.id));
  };

  const handleSelectBoard = (board: BoardType) => {
    loadBoard(board.id);
    if (selectedProject) {
      history.pushState(null, "", buildPath(selectedProject.id, board.id));
    }
  };

  const handleCreateProject = async (name: string) => {
    await api.createProject(name);
    await loadProjects();
  };

  const handleCreateBoard = async (name: string) => {
    if (!selectedProject) return;
    await api.createBoard(selectedProject.id, name);
    await loadBoards(selectedProject.id);
  };

  const handleBoardUpdate = () => {
    if (boardView) loadBoard(boardView.id);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-full">
      <Sidebar
        projects={projects}
        boards={boards}
        selectedProject={selectedProject}
        selectedBoardId={boardView?.id ?? null}
        onSelectProject={handleSelectProject}
        onSelectBoard={handleSelectBoard}
        onCreateProject={handleCreateProject}
        onCreateBoard={handleCreateBoard}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 backdrop-blur">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {boardView?.name ?? "Select a board"}
          </h1>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          >
            <span>Search</span>
            <kbd className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-500">⌘K</kbd>
          </button>
        </header>
        {boardView ? (
          <BoardComponent
            board={boardView}
            labels={labels}
            onUpdate={handleBoardUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <p>Select a project and board to get started</p>
          </div>
        )}
      </main>
      {searchOpen && (
        <SearchBar
          projectId={selectedProject?.id}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
