import React, { useState } from "react";
import type { CardWithLabels, Label } from "../../shared/types.ts";
import { CardDetail } from "./CardDetail.tsx";

interface CardProps {
  card: CardWithLabels;
  labels: Label[];
  onUpdate: () => void;
  index: number;
  columnId: number;
  isDragging: boolean;
  onDragStart: (cardId: number, columnId: number) => void;
  onDragEnd: () => void;
}

export function CardComponent({ card, labels, onUpdate, index, columnId, isDragging, onDragStart, onDragEnd }: CardProps) {
  const [showDetail, setShowDetail] = useState(false);

  const hasMeta = card.due_date || card.time_estimate || card.description;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(card.id));
    onDragStart(card.id, columnId);
  };

  return (
    <>
      <div
        data-card-id={card.id}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={() => { if (!isDragging) setShowDetail(true); }}
        className={`rounded-lg p-3 border cursor-grab transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group card-enter active:cursor-grabbing ${isDragging ? "card-dragging" : ""}`}
        style={{
          background: 'var(--surface-0)',
          borderColor: 'var(--border-subtle)',
          animationDelay: `${index * 30}ms`,
        }}
      >
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label) => (
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

        <p
          className="text-[13px] leading-snug font-medium transition-colors duration-150"
          style={{ color: 'var(--text-primary)' }}
        >
          {card.title}
        </p>

        {/* Metadata row */}
        {hasMeta && (
          <div className="flex items-center gap-2.5 mt-2">
            {card.due_date && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(card.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
            {card.time_estimate && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {card.time_estimate >= 60
                  ? `${Math.floor(card.time_estimate / 60)}h${card.time_estimate % 60 ? ` ${card.time_estimate % 60}m` : ""}`
                  : `${card.time_estimate}m`}
              </span>
            )}
            {card.description && (
              <svg
                className="w-3 h-3"
                style={{ color: 'var(--text-faint)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
              >
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {showDetail && (
        <CardDetail
          card={card}
          allLabels={labels}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
