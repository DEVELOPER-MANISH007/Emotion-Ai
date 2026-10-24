import { Clock3, Trash2 } from "lucide-react";
import { EMOTION_DETAILS, type AnalysisRecord } from "../types/emotion";

interface HistoryPanelProps {
  records: AnalysisRecord[];
  onClear: () => void;
}

export function HistoryPanel({ records, onClear }: HistoryPanelProps) {
  return (
    <section className="panel history-panel" aria-labelledby="history-title">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow"><Clock3 size={13} /> SESSION ONLY</span>
          <h2 id="history-title">Recent analyses</h2>
        </div>
        {records.length > 0 && (
          <button
            type="button"
            className="text-button"
            onClick={onClear}
            aria-label="Clear recent analyses"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>
      {records.length === 0 ? (
        <p className="history-empty">Your recent analyses will appear here while this page is open.</p>
      ) : (
        <ul className="history-list">
          {records.map((record) => {
            const details = EMOTION_DETAILS[record.predicted_emotion];
            return (
              <li className="history-item" key={record.id}>
                <span className="history-dot" style={{ backgroundColor: details.color }} />
                <div className="history-copy">
                  <p>{record.text}</p>
                  <span>{record.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="history-result">
                  <strong style={{ color: details.color }}>{details.label}</strong>
                  <span>{(record.confidence * 100).toFixed(1)}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
