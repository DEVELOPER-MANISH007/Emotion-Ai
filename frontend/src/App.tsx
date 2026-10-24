import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, LockKeyhole, Sparkles } from "lucide-react";
import { Analyzer } from "./components/Analyzer";
import { EmotionGuide } from "./components/EmotionGuide";
import { HistoryPanel } from "./components/HistoryPanel";
import { NavBar } from "./components/NavBar";
import { ResultPanel } from "./components/ResultPanel";
import { API_BASE_URL, analyzeText, checkApiHealth } from "./services/api";
import {
  EMOTION_DETAILS,
  type AnalysisRecord,
  type Emotion,
  type Prediction,
} from "./types/emotion";

export default function App() {
  const [text, setText] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const refreshHealth = useCallback(async () => {
    setApiOnline(await checkApiHealth());
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const runAnalysis = useCallback(async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeText(text);
      setPrediction(result);
      setHistory((previous) =>
        [
          {
            ...result,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: new Date(),
          },
          ...previous,
        ].slice(0, 5),
      );
      setApiOnline(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while analyzing your text.",
      );
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, [loading, text]);

  function clearAnalyzer() {
    setText("");
    setError(null);
  }

  return (
    <div className="app-shell" data-theme={theme} id="top">
      <NavBar
        apiOnline={apiOnline}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      />

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <motion.div
              className="hero-kicker"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="hero-kicker-icon"><Sparkles size={12} /></span>
              <span>THOUGHTFUL AI, MEET HUMAN EXPRESSION</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.08 }}
            >
              Understand the emotion
              <br className="desktop-break" /> behind <span>every word.</span>
            </motion.h1>
            <motion.p
              className="hero-description"
              initial={{ opacity: 0, y: 9 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
            >
              A closer look at what language can express. Explore six emotional signals with a locally saved, pretrained BiGRU model.
            </motion.p>
            <div className="hero-trust">
              <span><LockKeyhole size={13} /> Private by design</span>
              <i />
              <span>Six emotion classes</span>
              <i />
              <span>Real model inference</span>
            </div>
          </div>
          <div className="hero-aside" aria-hidden="true">
            <div className="signal-card">
              <div className="signal-top"><span className="signal-wave"><i /><i /><i /><i /><i /><i /><i /></span><span>LANGUAGE SIGNAL</span></div>
              <div className="signal-orb"><span /><span /><span /></div>
              <div className="signal-bottom"><span>Patterns in language</span><span className="signal-live"><i /> ANALYZING</span></div>
            </div>
            <span className="hero-orb hero-orb-one" />
            <span className="hero-orb hero-orb-two" />
          </div>
          <a className="hero-scroll" href="#analyzer"><ArrowDown size={14} /> START EXPLORING</a>
        </section>

        <section className="workspace-section" aria-label="Emotion analysis workspace">
          <div className="workspace-grid">
            <div className="workspace-left">
              <Analyzer
                text={text}
                loading={loading}
                error={error}
                onTextChange={(nextText) => {
                  setText(nextText);
                  setError(null);
                }}
                onAnalyze={() => void runAnalysis()}
                onClear={clearAnalyzer}
                onRetry={() => void runAnalysis()}
              />
              <HistoryPanel records={history} onClear={() => setHistory([])} />
            </div>
            <ResultPanel prediction={prediction} loading={loading} />
          </div>
        </section>

        <EmotionGuide />
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#top" aria-label="EmotionAI back to top">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>emotion<span className="brand-ai">ai</span></span>
        </a>
        <p>Made to listen a little closer. <span>·</span> React · Flask · TensorFlow</p>
        <div className="footer-links">
          <a href={`${API_BASE_URL}/api/health`} target="_blank" rel="noreferrer">API health</a>
          <a href={`${API_BASE_URL}/api/docs`} target="_blank" rel="noreferrer">API docs</a>
        </div>
      </footer>

      <span className="sr-only" aria-live="polite">
        {prediction
          ? `Latest prediction: ${EMOTION_DETAILS[prediction.predicted_emotion as Emotion].label}`
          : ""}
      </span>
    </div>
  );
}
