export const EMOTION_LABELS = [
  "sadness",
  "joy",
  "love",
  "anger",
  "fear",
  "surprise",
] as const;

export type Emotion = (typeof EMOTION_LABELS)[number];

export interface Prediction {
  text: string;
  predicted_emotion: Emotion;
  confidence: number;
  probabilities: Record<Emotion, number>;
}

export interface AnalysisRecord extends Prediction {
  id: string;
  createdAt: Date;
}

export interface EmotionMetadata {
  label: string;
  descriptor: string;
  color: string;
  tint: string;
  example: string;
}

export const EMOTION_DETAILS: Record<Emotion, EmotionMetadata> = {
  sadness: {
    label: "Sadness",
    descriptor: "Low mood, loss, or disappointment",
    color: "#7c8cf8",
    tint: "rgba(124, 140, 248, 0.14)",
    example: "I miss those quiet evenings we spent together.",
  },
  joy: {
    label: "Joy",
    descriptor: "Happiness, excitement, or contentment",
    color: "#f6bf59",
    tint: "rgba(246, 191, 89, 0.14)",
    example: "Everything is falling into place and I feel wonderful!",
  },
  love: {
    label: "Love",
    descriptor: "Affection, warmth, or deep appreciation",
    color: "#f17ca9",
    tint: "rgba(241, 124, 169, 0.14)",
    example: "I feel so grateful to have you in my life.",
  },
  anger: {
    label: "Anger",
    descriptor: "Frustration, irritation, or indignation",
    color: "#fa786e",
    tint: "rgba(250, 120, 110, 0.14)",
    example: "I can't believe they ignored the agreement again.",
  },
  fear: {
    label: "Fear",
    descriptor: "Anxiety, worry, or uncertainty",
    color: "#b08af4",
    tint: "rgba(176, 138, 244, 0.14)",
    example: "I'm nervous about what might happen tomorrow.",
  },
  surprise: {
    label: "Surprise",
    descriptor: "Unexpected events or sudden realization",
    color: "#58c6cf",
    tint: "rgba(88, 198, 207, 0.14)",
    example: "I never expected the whole team to show up!",
  },
};
