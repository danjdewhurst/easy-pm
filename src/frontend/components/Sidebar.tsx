import React, { useState } from "react";
import type { Project, Board } from "../../shared/types.ts";

interface SidebarProps {
  projects: Project[];
  boards: Board[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onSelectBoard: (board: Board) => void;
  onCreateProject: (name: string) => void;
  onCreateBoard: (name: string) => void;
}

export function Sidebar({
  projects,
  boards,
  selectedProject,
  onSelectProject,
  onSelectBoard,
  onCreateProject,
  onCreateBoard,
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
    <aside className="w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">easy-pm</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="text-slate-500 hover:text-slate-300 text-lg leading-none"
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
                className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </form>
          )}

          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                selectedProject?.id === project.id
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
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
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Boards</span>
              <button
                onClick={() => setShowNewBoard(!showNewBoard)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
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
                  className="w-full px-2 py-1.5 text-sm bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </form>
            )}

            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => onSelectBoard(board)}
                className="w-full text-left px-2.5 py-1.5 text-sm rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
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
