import { useEffect, useMemo, useRef, useState } from "react";
import type { CardWithLabels, Label } from "../../shared/types.ts";
import {
	formatTimeEstimate,
	parseTimeEstimate,
} from "../../shared/validate.ts";
import * as api from "../lib/api.ts";

interface CardDetailProps {
	card: CardWithLabels;
	allLabels: Label[];
	onClose: () => void;
	onUpdate: () => void;
}

export function CardDetail({
	card,
	allLabels,
	onClose,
	onUpdate,
}: CardDetailProps) {
	const [title, setTitle] = useState(card.title);
	const [description, setDescription] = useState(card.description ?? "");
	const [dueDate, setDueDate] = useState(card.due_date?.split("T")[0] ?? "");
	const [timeEstimate, setTimeEstimate] = useState(
		formatTimeEstimate(card.time_estimate),
	);
	const [selectedLabelIds, setSelectedLabelIds] = useState<Set<number>>(
		new Set(card.labels.map((l) => l.id)),
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const titleRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		titleRef.current?.focus();
		titleRef.current?.select();
	}, []);

	// Close on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	const isEstimateValid = useMemo(() => {
		if (!timeEstimate.trim()) return true;
		try {
			parseTimeEstimate(timeEstimate);
			return true;
		} catch {
			return false;
		}
	}, [timeEstimate]);

	const handleSave = async () => {
		setSaving(true);
		setError("");
		try {
			await api.updateCard(card.id, {
				title,
				description: description || null,
				due_date: dueDate ? new Date(dueDate).toISOString() : null,
				time_estimate: timeEstimate ? parseTimeEstimate(timeEstimate) : null,
			});
			await api.setCardLabels(card.id, Array.from(selectedLabelIds));
			onUpdate();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (confirm(`Delete card "${card.title}"?`)) {
			try {
				await api.deleteCard(card.id);
				onUpdate();
				onClose();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to delete");
			}
		}
	};

	const toggleLabel = (labelId: number) => {
		setSelectedLabelIds((prev) => {
			const next = new Set(prev);
			if (next.has(labelId)) {
				next.delete(labelId);
			} else {
				next.add(labelId);
			}
			return next;
		});
	};

	const inputStyle = {
		background: "var(--surface-2)",
		borderColor: "var(--border)",
		color: "var(--text-primary)",
	};

	return (
		<div
			className="fixed inset-0 flex items-center justify-center z-50 overlay-enter"
			style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label={`Edit card: ${card.title}`}
		>
			<div
				className="rounded-2xl border w-full max-w-lg mx-4 shadow-2xl animate-slide-up overflow-hidden"
				style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Accent bar */}
				<div className="h-1" style={{ background: "var(--accent)" }} />

				<div className="p-6 space-y-5">
					{error && (
						<div
							className="text-sm px-3 py-2 rounded-lg"
							style={{
								background: "var(--error-subtle)",
								color: "var(--error)",
							}}
						>
							{error}
						</div>
					)}

					{/* Title */}
					<input
						ref={titleRef}
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full text-lg font-semibold bg-transparent border-none outline-none tracking-tight"
						style={{ color: "var(--text-primary)" }}
						placeholder="Card title"
					/>

					{/* Description */}
					<div>
						<label
							className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
							style={{ color: "var(--text-muted)" }}
						>
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add a description..."
							rows={4}
							className="w-full px-3 py-2.5 text-sm border rounded-lg resize-none transition-colors duration-150 focus:outline-none"
							style={{
								...inputStyle,
								borderColor: description
									? "var(--border)"
									: "var(--border-subtle)",
							}}
						/>
					</div>

					{/* Due date + Time estimate */}
					<div className="flex gap-4">
						<div className="flex-1">
							<label
								className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
								style={{ color: "var(--text-muted)" }}
							>
								Due date
							</label>
							<input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="w-full px-3 py-2 text-sm border rounded-lg transition-colors duration-150 focus:outline-none"
								style={inputStyle}
							/>
						</div>
						<div className="flex-1">
							<label
								className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
								style={{ color: "var(--text-muted)" }}
							>
								Estimate
							</label>
							<input
								type="text"
								value={timeEstimate}
								onChange={(e) => setTimeEstimate(e.target.value)}
								placeholder="e.g. 1h 30m"
								className="w-full px-3 py-2 text-sm border rounded-lg transition-colors duration-150 focus:outline-none"
								style={{
									...inputStyle,
									borderColor: isEstimateValid
										? "var(--border)"
										: "var(--error)",
								}}
							/>
							{!isEstimateValid && (
								<p
									className="text-[11px] mt-1"
									style={{ color: "var(--error)" }}
								>
									Use format like 30m, 1h, or 1h 30m
								</p>
							)}
						</div>
					</div>

					{/* Labels */}
					{allLabels.length > 0 && (
						<div>
							<label
								className="text-[11px] font-semibold uppercase tracking-wider mb-2 block"
								style={{ color: "var(--text-muted)" }}
							>
								Labels
							</label>
							<div className="flex flex-wrap gap-2">
								{allLabels.map((label) => {
									const selected = selectedLabelIds.has(label.id);
									return (
										<button
											key={label.id}
											onClick={() => toggleLabel(label.id)}
											aria-pressed={selected}
											className="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all duration-150 btn-press"
											style={{
												backgroundColor: selected
													? `${label.colour}20`
													: "transparent",
												borderColor: selected ? label.colour : "var(--border)",
												color: selected ? label.colour : "var(--text-muted)",
											}}
										>
											{label.name}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				<div
					className="flex items-center justify-between px-6 py-4 border-t"
					style={{ borderColor: "var(--border-subtle)" }}
				>
					<button
						onClick={handleDelete}
						className="text-sm font-medium transition-all duration-150 hover:underline underline-offset-2 btn-press"
						style={{ color: "var(--error)" }}
					>
						Delete card
					</button>
					<div className="flex gap-2.5">
						<button
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 btn-press"
							style={{ color: "var(--text-secondary)" }}
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={saving || !isEstimateValid}
							className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-150 disabled:opacity-40 btn-press"
							style={{
								background: saving ? "var(--text-muted)" : "var(--accent)",
							}}
						>
							{saving ? "Saving..." : "Save changes"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
