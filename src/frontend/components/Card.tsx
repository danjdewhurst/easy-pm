import React, { useState } from "react";
import type { CardWithLabels, Label } from "../../shared/types.ts";
import { CardDetail } from "./CardDetail.tsx";

interface CardProps {
  card: CardWithLabels;
  labels: Label[];
  onUpdate: () => void;
}

export function CardComponent({ card, labels, onUpdate }: CardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-all hover:shadow-lg hover:shadow-slate-900/50 group"
      >
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label) => (
              <span
                key={label.id}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: label.colour + "30", color: label.colour }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-slate-200 group-hover:text-white transition-colors">
          {card.title}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-2">
          {card.due_date && (
            <span className="text-[11px] text-slate-500">
              {new Date(card.due_date).toLocaleDateString()}
            </span>
          )}
          {card.time_estimate && (
            <span className="text-[11px] text-slate-500">
              {card.time_estimate >= 60
                ? `${Math.floor(card.time_estimate / 60)}h${card.time_estimate % 60 ? ` ${card.time_estimate % 60}m` : ""}`
                : `${card.time_estimate}m`}
            </span>
          )}
          {card.description && (
            <span className="text-[11px] text-slate-600" title="Has description">
              &#9776;
            </span>
          )}
        </div>
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
