import { motion } from "framer-motion";
import { ArrowUpRight, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { EMOTION_DETAILS, EMOTION_LABELS, type Emotion } from "../types/emotion";

interface AnalyzerProps {
  text: string;
  loading: boolean;
  error: string | null;
  onTextChange: (text: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onRetry: () => void;
}

export function Analyzer({
  text,
  loading,
  error,
  onTextChange,
  onAnalyze,
  onClear,
  onRetry,
}: AnalyzerProps) {
  const canAnalyze = text.trim().length > 0 && !loading;

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && canAnalyze) {
      onAnalyze();
    }
  }

  return (
    <section className="panel analyzer-panel" id="analyzer" aria-labelledby="analyzer-title">
      <div className="section-heading analyzer-heading">
        <div>
          <span className="eyebrow"><Sparkles size={13} /> YOUR WORKSPACE</span>
          <h2 id="analyzer-title">Emotion analyzer</h2>
          <p>Share a thought and see what emotion comes through.</p>
        </div>
        <span className="model-chip"><span /> BiGRU model</span>
      </div>

      <label className="sr-only" htmlFor="emotion-text">
        Text to analyze
      </label>
      <div className="textarea-wrap">
        <textarea
          id="emotion-text"
          maxLength={2000}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a sentence, share a thought, or paste a short message..."
          aria-describedby="character-count analyzer-shortcut"
        />
        <div className="textarea-meta">
          <span id="analyzer-shortcut">Your words stay in this browser session.</span>
          <span id="character-count" className={text.length > 1800 ? "count-near-limit" : ""}>
            {text.length.toLocaleString()} / 2,000
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onRetry} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      <div className="analyzer-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={onAnalyze}
          disabled={!canAnalyze}
        >
          {loading ? (
            <><LoaderCircle className="spin" size={17} /> Analyzing...</>
          ) : (
            <>Analyze emotion <ArrowUpRight size={17} /></>
          )}
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={onClear}
          disabled={loading || !text}
        >
          <RotateCcw size={15} /> Clear
        </button>
        <span className="keyboard-hint">⌘ ↵ to analyze</span>
      </div>

      <div className="examples">
        <span className="examples-label">TRY AN EXAMPLE</span>
        <div className="example-chips">
          {EMOTION_LABELS.map((emotion: Emotion) => (
            <motion.button
              whileTap={{ scale: 0.96 }}
              key={emotion}
              type="button"
              className="example-chip"
              onClick={() => onTextChange(EMOTION_DETAILS[emotion].example)}
              style={{ "--emotion-color": EMOTION_DETAILS[emotion].color } as React.CSSProperties}
            >
              <span /> {EMOTION_DETAILS[emotion].label}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
