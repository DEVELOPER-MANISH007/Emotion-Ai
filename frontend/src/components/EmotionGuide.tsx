import { ArrowRight, BrainCircuit, Heart, Layers3, ScanText } from "lucide-react";
import { EMOTION_DETAILS, EMOTION_LABELS } from "../types/emotion";

const PIPELINE = [
  { label: "Text", icon: ScanText, detail: "Your message" },
  { label: "Tokenizer", icon: Layers3, detail: "Word sequence" },
  { label: "Padding", icon: Layers3, detail: "50 tokens" },
  { label: "BiGRU", icon: BrainCircuit, detail: "Context analysis" },
  { label: "Probabilities", icon: Heart, detail: "Six emotion scores" },
];

export function EmotionGuide() {
  return (
    <section className="guide-section" id="emotions" aria-labelledby="guide-title">
      <div className="guide-intro">
        <span className="eyebrow">A LITTLE MORE CONTEXT</span>
        <h2 id="guide-title">Emotion has more than one shade.</h2>
        <p>Language is nuanced. EmotionAI looks across six different signals to find the one that comes through most strongly.</p>
      </div>

      <div className="emotion-grid">
        {EMOTION_LABELS.map((emotion) => {
          const details = EMOTION_DETAILS[emotion];
          return (
            <article className="emotion-card" key={emotion}>
              <span className="emotion-card-mark" style={{ backgroundColor: details.color, boxShadow: `0 0 18px ${details.tint}` }} />
              <h3 style={{ color: details.color }}>{details.label}</h3>
              <p>{details.descriptor}</p>
            </article>
          );
        })}
      </div>

      <div className="pipeline-card">
        <div className="pipeline-heading">
          <div><span className="eyebrow">HOW IT WORKS</span><h3>From words to insight</h3></div>
          <span className="pipeline-tag">PRETRAINED · LOCAL MODEL</span>
        </div>
        <div className="pipeline-flow">
          {PIPELINE.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="pipeline-entry" key={step.label}>
                <div className="pipeline-step">
                  <span className="pipeline-icon"><Icon size={18} /></span>
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                </div>
                {index < PIPELINE.length - 1 && <ArrowRight className="pipeline-arrow" size={16} />}
              </div>
            );
          })}
        </div>
        <p className="pipeline-footnote">Your message is tokenized, padded to 50 positions, and analyzed by the saved Bidirectional GRU model. No retraining takes place.</p>
      </div>
    </section>
  );
}
