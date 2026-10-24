"""Flask API for the locally saved EmotionAI BiGRU model."""

from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path
from typing import Any

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import BadRequest
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "Artifacts"
MAX_TEXT_LENGTH = 2_000
MAX_REQUEST_BYTES = 16 * 1024
MAX_SEQUENCE_LENGTH = 50

# This order is the label feature order used by main.ipynb's DAIR-AI dataset.
EMOTION_LABELS = ("sadness", "joy", "love", "anger", "fear", "surprise")

logger = logging.getLogger(__name__)


def load_artifacts() -> tuple[Any, Any]:
    """Load and validate the trained model and tokenizer from project artifacts."""
    model_path = ARTIFACTS_DIR / "BiGRU_model.keras"
    tokenizer_path = ARTIFACTS_DIR / "tokenizer.pkl"

    if not model_path.is_file() or not tokenizer_path.is_file():
        raise FileNotFoundError("Required model artifacts are missing.")

    model = load_model(model_path, compile=False)
    if model.output_shape[-1] != len(EMOTION_LABELS):
        raise ValueError("The saved model output does not match the verified labels.")

    with tokenizer_path.open("rb") as artifact_file:
        tokenizer = pickle.load(artifact_file)

    if not callable(getattr(tokenizer, "texts_to_sequences", None)):
        raise TypeError("The saved tokenizer is not compatible.")

    return model, tokenizer


def create_app(
    model: Any | None = None, tokenizer: Any | None = None
) -> Flask:
    """Create the API app, loading the saved artifacts once when not injected."""
    app = Flask(__name__)
    app.json.sort_keys = False
    app.config["MAX_CONTENT_LENGTH"] = MAX_REQUEST_BYTES
    CORS(
        app,
        resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")}},
        methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    if model is None or tokenizer is None:
        try:
            model, tokenizer = load_artifacts()
        except Exception:
            logger.exception("EmotionAI model artifacts could not be loaded.")
            model, tokenizer = None, None

    app.config["EMOTION_MODEL"] = model
    app.config["EMOTION_TOKENIZER"] = tokenizer

    @app.errorhandler(413)
    def request_too_large(_: Any) -> tuple[Any, int]:
        return jsonify({"error": "Request body is too large."}), 413

    @app.get("/api/health")
    def health() -> tuple[Any, int]:
        """Report whether the prediction artifacts are ready."""
        loaded = (
            app.config["EMOTION_MODEL"] is not None
            and app.config["EMOTION_TOKENIZER"] is not None
        )
        return jsonify({"status": "ok" if loaded else "unavailable", "model_loaded": loaded}), (
            200 if loaded else 503
        )

    @app.get("/api/docs")
    def docs() -> Any:
        """Describe the available API endpoints."""
        return jsonify(
            {
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/health",
                        "description": "Check whether the model and tokenizer are loaded.",
                    },
                    {
                        "method": "POST",
                        "path": "/api/predict",
                        "description": "Classify text into one of six emotions.",
                        "request": {"text": "I am feeling really happy today!"},
                        "response_fields": [
                            "text",
                            "predicted_emotion",
                            "confidence",
                            "probabilities",
                        ],
                    },
                ],
                "emotions": list(EMOTION_LABELS),
                "maximum_text_length": MAX_TEXT_LENGTH,
            }
        )

    @app.post("/api/predict")
    def predict() -> tuple[Any, int] | Any:
        """Return the model's emotion prediction and all class probabilities."""
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json."}), 415
        try:
            payload = request.get_json(silent=False)
        except BadRequest:
            return jsonify({"error": "Request body must contain valid JSON."}), 400

        if not isinstance(payload, dict):
            return jsonify({"error": "Request body must be a JSON object."}), 400
        if "text" not in payload:
            return jsonify({"error": "The 'text' field is required."}), 400

        text = payload["text"]
        if not isinstance(text, str):
            return jsonify({"error": "The 'text' field must be a string."}), 400
        if not text.strip():
            return jsonify({"error": "Text must not be empty or whitespace only."}), 400
        if len(text) > MAX_TEXT_LENGTH:
            return jsonify(
                {"error": f"Text must be {MAX_TEXT_LENGTH} characters or fewer."}
            ), 400

        prediction_model = app.config["EMOTION_MODEL"]
        text_tokenizer = app.config["EMOTION_TOKENIZER"]
        if prediction_model is None or text_tokenizer is None:
            return jsonify({"error": "The prediction service is unavailable."}), 503

        try:
            sequences = text_tokenizer.texts_to_sequences([text])
            padded = pad_sequences(
                sequences,
                maxlen=MAX_SEQUENCE_LENGTH,
                padding="post",
                truncating="post",
            )
            raw_probabilities = np.asarray(
                prediction_model.predict(padded, verbose=0), dtype=np.float64
            )
            if raw_probabilities.shape != (1, len(EMOTION_LABELS)):
                raise ValueError("The model returned an unexpected probability shape.")

            probabilities = raw_probabilities[0]
            if (
                not np.all(np.isfinite(probabilities))
                or np.any(probabilities < 0)
                or np.any(probabilities > 1)
                or not np.isclose(np.sum(probabilities), 1.0, atol=1e-3)
            ):
                raise ValueError("The model returned invalid probabilities.")

            predicted_index = int(np.argmax(probabilities))
            return jsonify(
                {
                    "text": text,
                    "predicted_emotion": EMOTION_LABELS[predicted_index],
                    "confidence": float(probabilities[predicted_index]),
                    "probabilities": {
                        label: float(probabilities[index])
                        for index, label in enumerate(EMOTION_LABELS)
                    },
                }
            )
        except Exception:
            logger.exception("Emotion prediction failed.")
            return jsonify({"error": "Prediction failed. Please try again."}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "").lower() in {"1", "true"},
    )
