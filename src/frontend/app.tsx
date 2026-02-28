import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
	Board as BoardType,
	BoardView,
	Label,
	Project,
	PublicUser,
} from "../shared/types.ts";
import { BoardComponent } from "./components/Board.tsx";
import { LoginPage } from "./components/LoginPage.tsx";
import { RegisterPage } from "./components/RegisterPage.tsx";
import { SearchBar } from "./components/SearchBar.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import * as api from "./lib/api.ts";

function parseRoute(): { projectId?: number; boardId?: number } {
	const match = window.location.pathname.match(
		/^\/projects\/(\d+)(?:\/boards\/(\d+))?/,
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
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

const isMac =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.userAgent);

interface AppProps {
	user: PublicUser;
	onLogout: () => void;
}

function App({ user, onLogout }: AppProps) {
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [boards, setBoards] = useState<BoardType[]>([]);
	const [boardView, setBoardView] = useState<BoardView | null>(null);
	const [labels, setLabels] = useState<Label[]>([]);
	const [searchOpen, setSearchOpen] = useState(false);
	const [theme, setTheme] = useState<Theme>(getInitialTheme);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	}, []);

	const showError = useCallback((message: string) => {
		setError(message);
		setTimeout(() => setError(""), 5000);
	}, []);

	const loadProjects = useCallback(async () => {
		try {
			const data = await api.listProjects();
			setProjects(data);
			return data;
		} catch (err) {
			showError(err instanceof Error ? err.message : "Failed to load projects");
			return [];
		}
	}, [showError]);

	const loadBoards = useCallback(
		async (projectId: number) => {
			try {
				const data = await api.listBoards(projectId);
				setBoards(data);
			} catch (err) {
				showError(err instanceof Error ? err.message : "Failed to load boards");
			}
		},
		[showError],
	);

	const loadBoard = useCallback(
		async (boardId: number) => {
			try {
				const data = await api.getBoard(boardId);
				setBoardView(data);
			} catch (err) {
				showError(err instanceof Error ? err.message : "Failed to load board");
			}
		},
		[showError],
	);

	const loadLabels = useCallback(
		async (projectId: number) => {
			try {
				const data = await api.listLabels(projectId);
				setLabels(data);
			} catch (err) {
				showError(err instanceof Error ? err.message : "Failed to load labels");
			}
		},
		[showError],
	);

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
			setLoading(false);
		})();
	}, [loadBoard, loadProjects]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (selectedProject) {
			loadBoards(selectedProject.id);
			loadLabels(selectedProject.id);
		}
	}, [selectedProject, loadBoards, loadLabels]);

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
		try {
			await api.createProject(name);
			await loadProjects();
		} catch (err) {
			showError(
				err instanceof Error ? err.message : "Failed to create project",
			);
		}
	};

	const handleCreateBoard = async (name: string) => {
		if (!selectedProject) return;
		try {
			await api.createBoard(selectedProject.id, name);
			await loadBoards(selectedProject.id);
		} catch (err) {
			showError(err instanceof Error ? err.message : "Failed to create board");
		}
	};

	const handleBoardUpdate = () => {
		if (boardView) loadBoard(boardView.id);
	};

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
				userEmail={user.email}
				onLogout={onLogout}
			/>
			<main
				className="flex-1 flex flex-col overflow-hidden"
				style={{ background: "var(--surface-0)" }}
			>
				{/* Error toast */}
				{error && (
					<div
						className="px-4 py-2.5 text-sm text-center animate-slide-down"
						style={{ background: "#ef444420", color: "#ef4444" }}
					>
						{error}
					</div>
				)}

				{/* Header */}
				<header
					className="flex items-center justify-between px-8 h-[57px] border-b"
					style={{
						borderColor: "var(--border)",
						background: "var(--surface-1)",
					}}
				>
					<div className="flex items-center gap-3">
						{boardView && (
							<div
								className="w-2 h-2 rounded-full"
								style={{ background: "var(--accent)" }}
							/>
						)}
						<h1
							className="text-base font-semibold tracking-tight"
							style={{
								color: boardView ? "var(--text-primary)" : "var(--text-muted)",
							}}
						>
							{boardView?.name ?? (loading ? "Loading…" : "Select a board")}
						</h1>
						{boardView && (
							<span
								className="text-xs font-medium px-2 py-0.5 rounded-full"
								style={{
									background: "var(--surface-2)",
									color: "var(--text-muted)",
								}}
							>
								{boardView.columns.reduce(
									(sum, col) => sum + col.cards.length,
									0,
								)}{" "}
								cards
							</span>
						)}
					</div>
					<button
						onClick={() => setSearchOpen(true)}
						className="flex items-center gap-2.5 px-3.5 py-2 text-sm rounded-lg border transition-all duration-150 hover:border-[var(--accent)] hover:shadow-sm btn-press"
						style={{
							color: "var(--text-secondary)",
							background: "var(--surface-2)",
							borderColor: "var(--border)",
						}}
					>
						<svg
							className="w-3.5 h-3.5 opacity-50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<span>Search</span>
						<kbd
							className="text-[10px] font-medium px-1.5 py-0.5 rounded ml-1"
							style={{
								background: "var(--surface-3)",
								color: "var(--text-muted)",
							}}
						>
							{isMac ? "\u2318K" : "Ctrl+K"}
						</kbd>
					</button>
				</header>

				{/* Board or empty state */}
				{boardView ? (
					<BoardComponent
						board={boardView}
						labels={labels}
						onUpdate={handleBoardUpdate}
						onError={showError}
					/>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center animate-fade-in">
							<div
								className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
								style={{ background: "var(--accent-subtle)" }}
							>
								<svg
									className="w-7 h-7"
									style={{ color: "var(--accent)" }}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
									/>
								</svg>
							</div>
							<p
								className="text-sm font-medium"
								style={{ color: "var(--text-secondary)" }}
							>
								Select a project and board to get started
							</p>
							<p
								className="text-xs mt-1.5"
								style={{ color: "var(--text-muted)" }}
							>
								Choose from the sidebar or create something new
							</p>
						</div>
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

type AuthState = "loading" | "unauthenticated" | "authenticated";
type Page = "login" | "register";

function Root() {
	const [authState, setAuthState] = useState<AuthState>("loading");
	const [user, setUser] = useState<PublicUser | null>(null);
	const [page, setPage] = useState<Page>(
		window.location.pathname === "/register" ? "register" : "login",
	);

	useEffect(() => {
		const token = api.getToken();
		if (!token) {
			setAuthState("unauthenticated");
			return;
		}
		api
			.apiGetMe()
			.then((u) => {
				setUser(u);
				setAuthState("authenticated");
			})
			.catch(() => {
				api.clearToken();
				setAuthState("unauthenticated");
			});
	}, []);

	const handleLogin = async (email: string, password: string) => {
		const res = await api.apiLogin(email, password);
		api.setToken(res.token);
		setUser(res.user);
		setAuthState("authenticated");
		history.replaceState(null, "", "/");
	};

	const handleRegister = async (email: string, password: string) => {
		const res = await api.apiRegister(email, password);
		api.setToken(res.token);
		setUser(res.user);
		setAuthState("authenticated");
		history.replaceState(null, "", "/");
	};

	const handleLogout = async () => {
		try {
			await api.apiLogout();
		} catch {
			// Ignore — token may already be invalid
		}
		api.clearToken();
		setUser(null);
		setAuthState("unauthenticated");
		history.replaceState(null, "", "/login");
	};

	const navigateToRegister = () => {
		setPage("register");
		history.replaceState(null, "", "/register");
	};

	const navigateToLogin = () => {
		setPage("login");
		history.replaceState(null, "", "/login");
	};

	if (authState === "loading") {
		return (
			<div
				className="h-full flex items-center justify-center"
				style={{ background: "var(--surface-0)" }}
			>
				<p className="text-sm" style={{ color: "var(--text-muted)" }}>
					Loading…
				</p>
			</div>
		);
	}

	if (authState === "unauthenticated") {
		return page === "register" ? (
			<RegisterPage
				onRegister={handleRegister}
				onNavigateToLogin={navigateToLogin}
			/>
		) : (
			<LoginPage
				onLogin={handleLogin}
				onNavigateToRegister={navigateToRegister}
			/>
		);
	}

	return <App user={user!} onLogout={handleLogout} />;
}

const root = createRoot(document.getElementById("root")!);
root.render(<Root />);
