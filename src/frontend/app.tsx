import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import type { Project, Board as BoardType, BoardView, Label } from "../shared/types.ts";
import * as api from "./lib/api.ts";
import { Sidebar } from "./components/Sidebar.tsx";
import { BoardComponent } from "./components/Board.tsx";
import { SearchBar } from "./components/SearchBar.tsx";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [boardView, setBoardView] = useState<BoardView | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    const data = await api.listProjects();
    setProjects(data);
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

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadBoards(selectedProject.id);
      loadLabels(selectedProject.id);
    }
  }, [selectedProject, loadBoards, loadLabels]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setBoardView(null);
  };

  const handleSelectBoard = (board: BoardType) => {
    loadBoard(board.id);
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
        onSelectProject={handleSelectProject}
        onSelectBoard={handleSelectBoard}
        onCreateProject={handleCreateProject}
        onCreateBoard={handleCreateBoard}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
          <h1 className="text-lg font-semibold text-slate-200">
            {boardView?.name ?? "Select a board"}
          </h1>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <span>Search</span>
            <kbd className="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-500">⌘K</kbd>
          </button>
        </header>
        {boardView ? (
          <BoardComponent
            board={boardView}
            labels={labels}
            onUpdate={handleBoardUpdate}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
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
