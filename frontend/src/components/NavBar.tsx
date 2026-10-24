import { BrainCircuit, Moon, Sun } from "lucide-react";

interface NavBarProps {
  apiOnline: boolean | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function NavBar({ apiOnline, theme, onToggleTheme }: NavBarProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="EmotionAI home">
        <span className="brand-mark">
          <BrainCircuit size={21} strokeWidth={1.9} />
        </span>
        <span>emotion<span className="brand-ai">ai</span></span>
      </a>

      <nav className="nav-links" aria-label="Main navigation">
        <a className="nav-link nav-link-active" href="#analyzer">Dashboard</a>
        <a className="nav-link" href="#emotions">About the model</a>
      </nav>

      <div className="nav-actions">
        <div className="api-indicator" role="status">
          <span className={`status-dot ${apiOnline ? "is-online" : apiOnline === false ? "is-offline" : ""}`} />
          <span>{apiOnline === null ? "Connecting" : apiOnline ? "API online" : "API offline"}</span>
        </div>
        <button
          className="icon-button theme-button"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
