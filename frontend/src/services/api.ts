import { EMOTION_LABELS, type Emotion, type Prediction } from "../types/emotion";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isEmotion(value: unknown): value is Emotion {
  return (
    typeof value === "string" &&
    (EMOTION_LABELS as readonly string[]).includes(value)
  );
}

function isProbabilityRecord(value: unknown): value is Record<Emotion, number> {
  if (typeof value !== "object" || value === null) return false;
  const hasValidScores = EMOTION_LABELS.every((label) => {
    const score: unknown = Reflect.get(value, label);
    return (
      typeof score === "number" &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 1
    );
  });
  if (!hasValidScores) return false;
  const total = EMOTION_LABELS.reduce(
    (sum, label) => sum + Reflect.get(value, label),
    0,
  );
  return Math.abs(total - 1) <= 1e-3;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return (
      typeof body === "object" &&
      body !== null &&
      "model_loaded" in body &&
      body.model_loaded === true
    );
  } catch {
    return false;
  }
}

export async function analyzeText(text: string): Promise<Prediction> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new ApiError(
      "Can't reach the EmotionAI service. Check that the backend is running, then try again.",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "The analysis could not be completed. Please try again.";
    throw new ApiError(message, response.status);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    body.text !== text ||
    !("predicted_emotion" in body) ||
    !isEmotion(body.predicted_emotion) ||
    !("confidence" in body) ||
    typeof body.confidence !== "number" ||
    !Number.isFinite(body.confidence) ||
    body.confidence < 0 ||
    body.confidence > 1 ||
    !("probabilities" in body) ||
    !isProbabilityRecord(body.probabilities)
  ) {
    throw new ApiError("The service returned an unexpected response.");
  }

  const probabilities = body.probabilities;
  const highestEmotion = EMOTION_LABELS.reduce((highest, label) =>
    probabilities[label] > probabilities[highest] ? label : highest,
  );
  if (
    highestEmotion !== body.predicted_emotion ||
    Math.abs(probabilities[highestEmotion] - body.confidence) > 1e-6
  ) {
    throw new ApiError("The service returned inconsistent prediction scores.");
  }

  return {
    text,
    predicted_emotion: body.predicted_emotion,
    confidence: body.confidence,
    probabilities,
  };
}
