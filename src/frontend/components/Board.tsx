import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardView, Label } from "../../shared/types.ts";
import * as api from "../lib/api.ts";
import { ColumnComponent } from "./Column.tsx";

export interface DragState {
	cardId: number;
	sourceColumnId: number;
}

interface BoardProps {
	board: BoardView;
	labels: Label[];
	onUpdate: () => void;
	onError: (message: string) => void;
}

export function BoardComponent({
	board,
	labels,
	onUpdate,
	onError,
}: BoardProps) {
	const [newColumnName, setNewColumnName] = useState("");
	const [showNewColumn, setShowNewColumn] = useState(false);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (showNewColumn) inputRef.current?.focus();
	}, [showNewColumn]);

	const handleCreateColumn = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newColumnName.trim()) {
			try {
				await api.createColumn(board.id, newColumnName.trim());
				setNewColumnName("");
				setShowNewColumn(false);
				onUpdate();
			} catch (err) {
				onError(err instanceof Error ? err.message : "Failed to create column");
			}
		}
	};

	const handleDragStart = useCallback((cardId: number, columnId: number) => {
		setDragState({ cardId, sourceColumnId: columnId });
	}, []);

	const handleDragEnd = useCallback(() => {
		setDragState(null);
	}, []);

	const handleDrop = useCallback(
		async (targetColumnId: number, position: number) => {
			if (!dragState) return;
			const { cardId, sourceColumnId } = dragState;
			setDragState(null);

			// Skip if dropped in the exact same spot
			if (targetColumnId === sourceColumnId) {
				const column = board.columns.find((c) => c.id === sourceColumnId);
				const currentIndex =
					column?.cards.findIndex((c) => c.id === cardId) ?? -1;
				if (currentIndex === position || currentIndex === position - 1) {
					return;
				}
			}

			try {
				await api.moveCard(cardId, targetColumnId, position);
				onUpdate();
			} catch (err) {
				onError(err instanceof Error ? err.message : "Failed to move card");
			}
		},
		[dragState, board.columns, onUpdate, onError],
	);

	return (
		<div className="flex-1 overflow-x-auto board-scroll p-6">
			<div className="flex gap-5 h-full items-start">
				{board.columns.map((column, i) => (
					<ColumnComponent
						key={column.id}
						column={column}
						labels={labels}
						onUpdate={onUpdate}
						onError={onError}
						index={i}
						dragState={dragState}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						onDrop={handleDrop}
					/>
				))}

				{/* Add column */}
				<div className="flex-shrink-0 w-72">
					{showNewColumn ? (
						<form
							onSubmit={handleCreateColumn}
							className="rounded-xl p-3 border animate-scale-in"
							style={{
								background: "var(--surface-1)",
								borderColor: "var(--border)",
							}}
						>
							<input
								ref={inputRef}
								type="text"
								value={newColumnName}
								onChange={(e) => setNewColumnName(e.target.value)}
								placeholder="Column name"
								onKeyDown={(e) => {
									if (e.key === "Escape") setShowNewColumn(false);
								}}
								className="w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-150"
								style={{
									background: "var(--surface-2)",
									borderColor: "var(--border)",
									color: "var(--text-primary)",
								}}
							/>
							<div className="flex gap-2 mt-2.5">
								<button
									type="submit"
									className="px-3.5 py-1.5 text-sm font-medium text-white rounded-lg transition-all duration-150 btn-press"
									style={{ background: "var(--accent)" }}
								>
									Add column
								</button>
								<button
									type="button"
									onClick={() => setShowNewColumn(false)}
									className="px-3 py-1.5 text-sm transition-colors duration-150"
									style={{ color: "var(--text-muted)" }}
								>
									Cancel
								</button>
							</div>
						</form>
					) : (
						<button
							onClick={() => setShowNewColumn(true)}
							className="w-full px-4 py-3.5 text-sm rounded-xl border border-dashed transition-all duration-200 hover:border-solid group btn-press"
							style={{
								color: "var(--text-muted)",
								borderColor: "var(--border)",
							}}
						>
							<span className="flex items-center justify-center gap-2">
								<svg
									className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
								>
									<path strokeLinecap="round" d="M12 5v14m-7-7h14" />
								</svg>
								Add column
							</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
