import React, { useState, useRef, useEffect } from "react";
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
  userEmail?: string;
  onLogout?: () => void;
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
  userEmail,
  onLogout,
}: SidebarProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const boardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewProject) projectInputRef.current?.focus();
  }, [showNewProject]);

  useEffect(() => {
    if (showNewBoard) boardInputRef.current?.focus();
  }, [showNewBoard]);

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
    <aside
      className="w-60 flex flex-col h-full border-r relative surface-texture"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
    >
      {/* Brand */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="font-brand text-xl tracking-tight" style={{ color: 'var(--accent)' }}>
          easy-pm
        </h2>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg transition-all duration-150 hover:scale-105 btn-press"
          style={{ color: 'var(--text-muted)' }}
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

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Projects
            </span>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="w-5 h-5 flex items-center justify-center rounded transition-all duration-150 text-xs hover:scale-110"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
              </svg>
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={handleCreateProject} className="mb-2 animate-slide-down">
              <input
                ref={projectInputRef}
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                onKeyDown={(e) => { if (e.key === "Escape") setShowNewProject(false); }}
                onBlur={() => { if (!newProjectName.trim()) setShowNewProject(false); }}
                className="w-full px-2.5 py-1.5 text-sm rounded-md border transition-colors duration-150"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: 'var(--accent)',
                  color: 'var(--text-primary)',
                }}
              />
            </form>
          )}

          <div className="space-y-0.5">
            {projects.map((project) => {
              const isSelected = selectedProject?.id === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="w-full text-left px-2.5 py-1.5 text-[13px] rounded-md transition-all duration-150 flex items-center gap-2 group"
                  style={{
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full transition-all duration-200 flex-shrink-0"
                    style={{
                      background: isSelected ? 'var(--accent)' : 'var(--border)',
                      transform: isSelected ? 'scale(1)' : 'scale(0.8)',
                    }}
                  />
                  <span className="truncate">{project.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Boards section */}
        {selectedProject && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2 px-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Boards
              </span>
              <button
                onClick={() => setShowNewBoard(!showNewBoard)}
                className="w-5 h-5 flex items-center justify-center rounded transition-all duration-150 text-xs hover:scale-110"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
                </svg>
              </button>
            </div>

            {showNewBoard && (
              <form onSubmit={handleCreateBoard} className="mb-2 animate-slide-down">
                <input
                  ref={boardInputRef}
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Board name"
                  onKeyDown={(e) => { if (e.key === "Escape") setShowNewBoard(false); }}
                  onBlur={() => { if (!newBoardName.trim()) setShowNewBoard(false); }}
                  className="w-full px-2.5 py-1.5 text-sm rounded-md border transition-colors duration-150"
                  style={{
                    background: 'var(--surface-2)',
                    borderColor: 'var(--accent)',
                    color: 'var(--text-primary)',
                  }}
                />
              </form>
            )}

            <div className="space-y-0.5">
              {boards.map((board) => {
                const isSelected = selectedBoardId === board.id;
                return (
                  <button
                    key={board.id}
                    onClick={() => onSelectBoard(board)}
                    className="w-full text-left px-2.5 py-1.5 text-[13px] rounded-md transition-all duration-150 flex items-center gap-2 group"
                    style={{
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="truncate">{board.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 border-t space-y-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
          {selectedProject ? selectedProject.name : "No project selected"}
        </div>
        {userEmail && (
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] truncate max-w-[140px]"
              style={{ color: 'var(--text-muted)' }}
              title={userEmail}
            >
              {userEmail}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-[10px] font-medium transition-colors duration-150"
                style={{ color: 'var(--text-muted)' }}
                title="Sign out"
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
