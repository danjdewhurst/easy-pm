import React, { useState } from "react";
import type { CardWithLabels, Label } from "../../shared/types.ts";
import { formatTimeEstimate, parseTimeEstimate } from "../../shared/validate.ts";
import * as api from "../lib/api.ts";

interface CardDetailProps {
  card: CardWithLabels;
  allLabels: Label[];
  onClose: () => void;
  onUpdate: () => void;
}

export function CardDetail({ card, allLabels, onClose, onUpdate }: CardDetailProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(card.due_date?.split("T")[0] ?? "");
  const [timeEstimate, setTimeEstimate] = useState(formatTimeEstimate(card.time_estimate));
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<number>>(
    new Set(card.labels.map((l) => l.id)),
  );
  const [saving, setSaving] = useState(false);

  const isEstimateValid = (() => {
    if (!timeEstimate.trim()) return true;
    try {
      parseTimeEstimate(timeEstimate);
      return true;
    } catch {
      return false;
    }
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCard(card.id, {
        title,
        description: description || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        time_estimate: timeEstimate ? timeEstimate : null,
      });
      await api.setCardLabels(card.id, Array.from(selectedLabelIds));
      onUpdate();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete card "${card.title}"?`)) {
      await api.deleteCard(card.id);
      onUpdate();
      onClose();
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold bg-transparent text-slate-100 border-none outline-none focus:ring-0 placeholder-slate-500"
            placeholder="Card title"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />

          {/* Due date + Time estimate */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Estimate (e.g. 30m, 1h 30m)</label>
              <input
                type="text"
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
                placeholder="e.g. 1h 30m"
                className="w-full px-3 py-1.5 text-sm bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Labels */}
          {allLabels.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Labels</label>
              <div className="flex flex-wrap gap-2">
                {allLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${
                      selectedLabelIds.has(label.id)
                        ? "border-current opacity-100"
                        : "border-transparent opacity-50 hover:opacity-75"
                    }`}
                    style={{ backgroundColor: label.colour + "25", color: label.colour }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
          <button
            onClick={handleDelete}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
