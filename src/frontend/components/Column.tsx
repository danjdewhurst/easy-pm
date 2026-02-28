import React, { useEffect, useRef, useState } from "react";
import type { ColumnView, Label } from "../../shared/types.ts";
import * as api from "../lib/api.ts";
import type { DragState } from "./Board.tsx";
import { CardComponent } from "./Card.tsx";

interface ColumnProps {
	column: ColumnView;
	labels: Label[];
	onUpdate: () => void;
	index: number;
	dragState: DragState | null;
	onDragStart: (cardId: number, columnId: number) => void;
	onDragEnd: () => void;
	onDrop: (targetColumnId: number, position: number) => void;
}

export function ColumnComponent({
	column,
	labels,
	onUpdate,
	index,
	dragState,
	onDragStart,
	onDragEnd,
	onDrop,
}: ColumnProps) {
	const [newCardTitle, setNewCardTitle] = useState("");
	const [showNewCard, setShowNewCard] = useState(false);
	const [dropIndex, setDropIndex] = useState<number | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (showNewCard) inputRef.current?.focus();
	}, [showNewCard]);

	const handleCreateCard = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newCardTitle.trim()) {
			await api.createCard(column.id, newCardTitle.trim());
			setNewCardTitle("");
			setShowNewCard(false);
			onUpdate();
		}
	};

	const handleDeleteColumn = async () => {
		if (confirm(`Delete column "${column.name}" and all its cards?`)) {
			await api.deleteColumn(column.id);
			onUpdate();
		}
	};

	const isDragOver = dragState !== null && dropIndex !== null;

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";

		const cardsContainer = e.currentTarget as HTMLElement;
		const cardElements = Array.from(
			cardsContainer.querySelectorAll("[data-card-id]"),
		);

		if (cardElements.length === 0) {
			setDropIndex(0);
			return;
		}

		const mouseY = e.clientY;
		let closestIndex = cardElements.length;

		for (let i = 0; i < cardElements.length; i++) {
			const rect = (cardElements[i] as HTMLElement).getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			if (mouseY < midY) {
				closestIndex = i;
				break;
			}
		}

		setDropIndex(closestIndex);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		// Only reset if leaving the container entirely
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setDropIndex(null);
		}
	};

	const handleDropOnColumn = (e: React.DragEvent) => {
		e.preventDefault();
		const position = dropIndex ?? column.cards.length;
		setDropIndex(null);
		onDrop(column.id, position);
	};

	return (
		<div
			className={`flex-shrink-0 w-72 rounded-xl border flex flex-col max-h-full animate-scale-in transition-colors duration-150 ${isDragOver ? "column-drag-over" : ""}`}
			style={{
				background: "var(--surface-1)",
				borderColor: isDragOver ? "var(--accent)" : "var(--border)",
				animationDelay: `${index * 50}ms`,
			}}
		>
			{/* Column header */}
			<div
				className="flex items-center justify-between px-3.5 py-3 border-b"
				style={{ borderColor: "var(--border-subtle)" }}
			>
				<div className="flex items-center gap-2.5">
					<h3
						className="text-[13px] font-semibold tracking-tight"
						style={{ color: "var(--text-primary)" }}
					>
						{column.name}
					</h3>
					<span
						className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
						style={{
							background: "var(--surface-2)",
							color: "var(--text-muted)",
						}}
					>
						{column.cards.length}
					</span>
				</div>
				<button
					onClick={handleDeleteColumn}
					className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-150 hover:scale-110"
					style={{ color: "var(--text-faint)" }}
					title="Delete column"
				>
					<svg
						className="w-3.5 h-3.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						strokeWidth={2}
					>
						<path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{/* Cards */}
			<div
				className="column-cards flex-1 overflow-y-auto p-2.5"
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDropOnColumn}
			>
				{column.cards.map((card, i) => (
					<React.Fragment key={card.id}>
						{dropIndex === i && dragState?.cardId !== card.id && (
							<div className="drop-indicator" />
						)}
						<div className={i > 0 ? "mt-2" : ""}>
							<CardComponent
								card={card}
								labels={labels}
								onUpdate={onUpdate}
								index={i}
								columnId={column.id}
								isDragging={dragState?.cardId === card.id}
								onDragStart={onDragStart}
								onDragEnd={onDragEnd}
							/>
						</div>
					</React.Fragment>
				))}
				{dropIndex === column.cards.length && (
					<div
						className={`drop-indicator ${column.cards.length > 0 ? "mt-2" : ""}`}
					/>
				)}
			</div>

			{/* Add card */}
			<div
				className="p-2.5 border-t"
				style={{ borderColor: "var(--border-subtle)" }}
			>
				{showNewCard ? (
					<form onSubmit={handleCreateCard} className="animate-slide-down">
						<input
							ref={inputRef}
							type="text"
							value={newCardTitle}
							onChange={(e) => setNewCardTitle(e.target.value)}
							placeholder="Card title"
							onKeyDown={(e) => {
								if (e.key === "Escape") setShowNewCard(false);
							}}
							onBlur={() => {
								if (!newCardTitle.trim()) setShowNewCard(false);
							}}
							className="w-full px-3 py-2 text-sm rounded-lg border transition-colors duration-150"
							style={{
								background: "var(--surface-2)",
								borderColor: "var(--accent)",
								color: "var(--text-primary)",
							}}
						/>
					</form>
				) : (
					<button
						onClick={() => setShowNewCard(true)}
						className="w-full text-left px-3 py-1.5 text-[13px] rounded-lg transition-all duration-150 group btn-press"
						style={{ color: "var(--text-muted)" }}
					>
						<span className="flex items-center gap-1.5">
							<svg
								className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-90"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								strokeWidth={2}
							>
								<path strokeLinecap="round" d="M12 5v14m-7-7h14" />
							</svg>
							Add card
						</span>
					</button>
				)}
			</div>
		</div>
	);
}
