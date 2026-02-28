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
    <div
      className="fixed inset-0 flex items-start justify-center pt-[18vh] z-50 overlay-enter"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border w-full max-w-xl mx-4 shadow-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <svg
            className="w-4.5 h-4.5 flex-shrink-0"
            style={{ color: 'var(--accent)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {loading && (
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--accent-muted)', borderTopColor: 'var(--accent)' }}
            />
          )}
          <kbd
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((result, i) => (
              <div
                key={result.card.id}
                className="px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 card-enter"
                style={{
                  animationDelay: `${i * 30}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {result.card.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {result.project_name}
                  <span className="mx-1.5 opacity-40">/</span>
                  {result.board_name}
                  <span className="mx-1.5 opacity-40">/</span>
                  {result.column_name}
                </p>
                {result.card.labels.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {result.card.labels.map((label) => (
                      <span
                        key={label.id}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: label.colour + "20", color: label.colour }}
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

        {/* Empty state */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center animate-fade-in">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No results for "<span style={{ color: 'var(--text-secondary)' }}>{query}</span>"
            </p>
          </div>
        )}

        {/* Hint when empty */}
        {!query.trim() && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Type to search across all cards
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
