import { motion } from "framer-motion";
import {
  Activity,
  Frown,
  Heart,
  Laugh,
  Meh,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EMOTION_DETAILS, EMOTION_LABELS, type Emotion, type Prediction } from "../types/emotion";

const EMOTION_ICONS = {
  sadness: Frown,
  joy: Laugh,
  love: Heart,
  anger: ShieldAlert,
  fear: Meh,
  surprise: Sparkles,
} satisfies Record<Emotion, typeof Frown>;

interface ResultPanelProps {
  prediction: Prediction | null;
  loading: boolean;
}

export function ResultPanel({ prediction, loading }: ResultPanelProps) {
  if (loading && !prediction) {
    return (
      <section className="panel result-panel result-skeleton" aria-label="Loading prediction">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <span className="loading-caption"><Activity size={14} className="pulse" /> Reading the emotional signal...</span>
      </section>
    );
  }

  if (!prediction) {
    return (
      <section className="panel result-panel empty-result" aria-label="Prediction results">
        <div className="empty-orbit">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="empty-icon"><Activity size={24} /></span>
        </div>
        <span className="eyebrow">YOUR INSIGHTS</span>
        <h3>Your results will appear here</h3>
        <p>Once you analyze a message, its strongest emotional signal and full probability breakdown will show up here.</p>
        <div className="empty-points">
          <span><i /> Six emotion classes</span>
          <span><i /> Model-based confidence</span>
          <span><i /> Private to this session</span>
        </div>
      </section>
    );
  }

  const selected = prediction.predicted_emotion;
  const details = EMOTION_DETAILS[selected];
  const Icon = EMOTION_ICONS[selected];
  const chartData = EMOTION_LABELS.map((emotion) => ({
    emotion: EMOTION_DETAILS[emotion].label,
    value: prediction.probabilities[emotion] * 100,
    fill: EMOTION_DETAILS[emotion].color,
  }));

  return (
    <motion.section
      className="panel result-panel"
      aria-labelledby="result-title"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34 }}
    >
      <div className="section-heading result-heading">
        <div>
          <span className="eyebrow"><Activity size={13} /> YOUR INSIGHTS</span>
          <h2 id="result-title">Prediction results</h2>
        </div>
        <span className="result-live"><span /> COMPLETE</span>
      </div>

      <div
        className="prediction-feature"
        style={{ "--emotion-color": details.color, "--emotion-tint": details.tint } as React.CSSProperties}
      >
        <div className="prediction-icon"><Icon size={24} strokeWidth={1.8} /></div>
        <div className="prediction-main">
          <span className="prediction-overline">STRONGEST SIGNAL</span>
          <h3>{details.label}</h3>
          <p>{details.descriptor}</p>
        </div>
        <div className="confidence">
          <strong>{(prediction.confidence * 100).toFixed(1)}<small>%</small></strong>
          <span>model score</span>
        </div>
      </div>

      <div className="probability-section">
        <div className="subsection-heading">
          <div><h3>Emotion breakdown</h3><span>Relative model scores</span></div>
          <span className="distribution-label">6 EMOTIONS</span>
        </div>
        <div className="probability-list">
          {EMOTION_LABELS.map((emotion, index) => {
            const score = prediction.probabilities[emotion] * 100;
            return (
              <div className="probability-row" key={emotion}>
                <span className={`probability-name ${emotion === selected ? "is-selected" : ""}`}>
                  <i style={{ backgroundColor: EMOTION_DETAILS[emotion].color }} />
                  {EMOTION_DETAILS[emotion].label}
                </span>
                <div className="probability-track">
                  <motion.div
                    className="probability-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.7, delay: index * 0.06, ease: "easeOut" }}
                    style={{ backgroundColor: EMOTION_DETAILS[emotion].color }}
                  />
                </div>
                <span className="probability-value">{score.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-section">
        <div className="subsection-heading">
          <div><h3>Probability distribution</h3><span>All six model outputs</span></div>
        </div>
        <div className="chart-wrap" role="img" aria-label="Horizontal bar chart showing probabilities for all six emotions">
          <ResponsiveContainer width="100%" height={204}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 2 }}>
              <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: "var(--muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="emotion"
                width={68}
                tick={{ fill: "var(--muted-strong)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Model score"]}
                contentStyle={{
                  background: "var(--panel-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontSize: 12,
                }}
                cursor={{ fill: "var(--surface)" }}
              />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="confidence-note">
        <span>ⓘ</span> Confidence is the model’s score for this prediction, not a guarantee of correctness.
      </p>
    </motion.section>
  );
}
