import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { analyzeText, checkApiHealth } from "./services/api";
import type { Prediction } from "./types/emotion";

vi.mock("./services/api", () => ({
  API_BASE_URL: "http://127.0.0.1:5000",
  analyzeText: vi.fn(),
  checkApiHealth: vi.fn(),
}));

const result: Prediction = {
  text: "I feel so grateful to have you in my life.",
  predicted_emotion: "love",
  confidence: 0.82,
  probabilities: {
    sadness: 0.02,
    joy: 0.06,
    love: 0.82,
    anger: 0.02,
    fear: 0.04,
    surprise: 0.04,
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EmotionAI dashboard", () => {
  it("shows the API status and the empty prediction state", async () => {
    vi.mocked(checkApiHealth).mockResolvedValue(true);
    render(<App />);

    expect(screen.getByText("Your results will appear here")).toBeInTheDocument();
    expect(await screen.findByText("API online")).toBeInTheDocument();
  });

  it("validates an empty message without calling the API", async () => {
    vi.mocked(checkApiHealth).mockResolvedValue(true);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /analyze emotion/i }));

    expect(analyzeText).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /analyze emotion/i })).toBeDisabled();
  });

  it("shows the six-class prediction and adds a session history entry", async () => {
    vi.mocked(checkApiHealth).mockResolvedValue(true);
    vi.mocked(analyzeText).mockResolvedValue(result);
    render(<App />);

    await userEvent.type(
      screen.getByLabelText("Text to analyze"),
      result.text,
    );
    await userEvent.click(screen.getByRole("button", { name: /analyze emotion/i }));

    expect((await screen.findAllByRole("heading", { name: "Love" }))[0]).toBeInTheDocument();
    expect(document.querySelectorAll(".probability-value")[2]).toHaveTextContent("82.0%");
    expect(screen.getByText("Recent analyses")).toBeInTheDocument();
    expect(screen.getAllByText("Surprise").length).toBeGreaterThan(0);
    expect(analyzeText).toHaveBeenCalledWith(result.text);
  });

  it("preserves entered text and shows a retry action when the API fails", async () => {
    vi.mocked(checkApiHealth).mockResolvedValue(false);
    vi.mocked(analyzeText)
      .mockRejectedValueOnce(new Error("Backend is offline."))
      .mockResolvedValueOnce(result);
    render(<App />);

    const input = screen.getByLabelText("Text to analyze");
    await userEvent.type(input, "Keep this sentence.");
    await userEvent.click(screen.getByRole("button", { name: /analyze emotion/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Backend is offline.");
    expect(input).toHaveValue("Keep this sentence.");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect((await screen.findAllByRole("heading", { name: "Love" }))[0]).toBeInTheDocument();
    expect(analyzeText).toHaveBeenCalledTimes(2);
  });

  it("fills an example, clears input, and clears session history", async () => {
    vi.mocked(checkApiHealth).mockResolvedValue(true);
    vi.mocked(analyzeText).mockResolvedValue(result);
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /surprise/i }));
    expect(screen.getByLabelText("Text to analyze")).toHaveValue(
      "I never expected the whole team to show up!",
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Text to analyze")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("Text to analyze"), {
      target: { value: result.text },
    });
    await userEvent.click(screen.getByRole("button", { name: /analyze emotion/i }));
    await screen.findAllByRole("heading", { name: "Love" });
    await userEvent.click(screen.getByRole("button", { name: "Clear recent analyses" }));
    expect(screen.getByText("Your recent analyses will appear here while this page is open.")).toBeInTheDocument();
  });
});
