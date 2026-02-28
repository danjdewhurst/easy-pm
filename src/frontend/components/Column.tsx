import React, { useState } from "react";
import type { ColumnView, Label } from "../../shared/types.ts";
import { CardComponent } from "./Card.tsx";
import * as api from "../lib/api.ts";

interface ColumnProps {
  column: ColumnView;
  labels: Label[];
  onUpdate: () => void;
}

export function ColumnComponent({ column, labels, onUpdate }: ColumnProps) {
  const [newCardTitle, setNewCardTitle] = useState("");
  const [showNewCard, setShowNewCard] = useState(false);

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

  return (
    <div className="flex-shrink-0 w-72 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col max-h-full">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{column.name}</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
            {column.cards.length}
          </span>
        </div>
        <button
          onClick={handleDeleteColumn}
          className="text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors text-sm"
          title="Delete column"
        >
          &times;
        </button>
      </div>

      {/* Cards */}
      <div className="column-cards flex-1 overflow-y-auto p-2 space-y-2">
        {column.cards.map((card) => (
          <CardComponent key={card.id} card={card} labels={labels} onUpdate={onUpdate} />
        ))}
      </div>

      {/* Add card */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700/30">
        {showNewCard ? (
          <form onSubmit={handleCreateCard}>
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title"
              autoFocus
              onBlur={() => {
                if (!newCardTitle.trim()) setShowNewCard(false);
              }}
              className="w-full px-2.5 py-1.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>
        ) : (
          <button
            onClick={() => setShowNewCard(true)}
            className="w-full text-left px-2.5 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
