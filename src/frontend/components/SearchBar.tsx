import React, { useState, useEffect, useRef } from "react";
import type { SearchResult } from "../../shared/types.ts";
import * as api from "../lib/api.ts";

interface SearchBarProps {
  projectId?: number;
  onClose: () => void;
}

export function SearchBar({ projectId, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query, projectId);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, projectId]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-xl mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
          <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards..."
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((result) => (
              <div
                key={result.card.id}
                className="px-3 py-2.5 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <p className="text-sm text-slate-200">{result.card.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {result.project_name} &rarr; {result.board_name} &rarr; {result.column_name}
                </p>
                {result.card.labels.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {result.card.labels.map((label) => (
                      <span
                        key={label.id}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: label.colour + "30", color: label.colour }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-500">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
