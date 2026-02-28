import React, { useState } from "react";
import type { BoardView, Label } from "../../shared/types.ts";
import { ColumnComponent } from "./Column.tsx";
import * as api from "../lib/api.ts";

interface BoardProps {
  board: BoardView;
  labels: Label[];
  onUpdate: () => void;
}

export function BoardComponent({ board, labels, onUpdate }: BoardProps) {
  const [newColumnName, setNewColumnName] = useState("");
  const [showNewColumn, setShowNewColumn] = useState(false);

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnName.trim()) {
      await api.createColumn(board.id, newColumnName.trim());
      setNewColumnName("");
      setShowNewColumn(false);
      onUpdate();
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-4 h-full items-start">
        {board.columns.map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            labels={labels}
            onUpdate={onUpdate}
          />
        ))}

        {/* Add column */}
        <div className="flex-shrink-0 w-72">
          {showNewColumn ? (
            <form onSubmit={handleCreateColumn} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
                autoFocus
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewColumn(false)}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowNewColumn(true)}
              className="w-full px-4 py-3 text-sm text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50 hover:border-slate-600 hover:text-slate-400 transition-colors"
            >
              + Add column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
