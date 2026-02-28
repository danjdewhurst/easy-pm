import React, { useState } from "react";
import type { Project, Board } from "../../shared/types.ts";

interface SidebarProps {
  projects: Project[];
  boards: Board[];
  selectedProject: Project | null;
  selectedBoardId: number | null;
  onSelectProject: (project: Project) => void;
  onSelectBoard: (board: Board) => void;
  onCreateProject: (name: string) => void;
  onCreateBoard: (name: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Sidebar({
  projects,
  boards,
  selectedProject,
  selectedBoardId,
  onSelectProject,
  onSelectBoard,
  onCreateProject,
  onCreateBoard,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
    }
  };

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim());
      setNewBoardName("");
      setShowNewBoard(false);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
        <h2 className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">easy-pm</h2>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Projects</span>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none"
            >
              +
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={handleCreateProject} className="mb-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                autoFocus
                className="w-full px-2 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </form>
          )}

          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                selectedProject?.id === project.id
                  ? "bg-indigo-600/20 text-indigo-600 dark:text-indigo-300"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>

        {/* Boards (shown when a project is selected) */}
        {selectedProject && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Boards</span>
              <button
                onClick={() => setShowNewBoard(!showNewBoard)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none"
              >
                +
              </button>
            </div>

            {showNewBoard && (
              <form onSubmit={handleCreateBoard} className="mb-2">
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Board name"
                  autoFocus
                  className="w-full px-2 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </form>
            )}

            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => onSelectBoard(board)}
                className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                  selectedBoardId === board.id
                    ? "bg-indigo-600/20 text-indigo-600 dark:text-indigo-300"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {board.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
