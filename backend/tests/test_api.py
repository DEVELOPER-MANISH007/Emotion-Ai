from __future__ import annotations

import json

import numpy as np
import pytest

from backend.app import EMOTION_LABELS, app as artifact_app, create_app


class StubTokenizer:
    def texts_to_sequences(self, texts: list[str]) -> list[list[int]]:
        return [[1, 2] for _ in texts]


class StubModel:
    output = np.array([[0.05, 0.1, 0.55, 0.1, 0.1, 0.1]])

    def __init__(self) -> None:
        self.calls = 0
        self.last_input: np.ndarray | None = None

    def predict(self, inputs: np.ndarray, verbose: int = 0) -> np.ndarray:
        self.calls += 1
        self.last_input = inputs
        return self.output


@pytest.fixture()
def model() -> StubModel:
    return StubModel()


@pytest.fixture()
def client(model: StubModel):
    app = create_app(model, StubTokenizer())
    app.config.update(TESTING=True)
    return app.test_client()


def test_health_reports_loaded_model(client) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json == {"status": "ok", "model_loaded": True}


def test_cors_allows_only_the_local_frontend_origin(client) -> None:
    allowed = client.options(
        "/api/predict",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    denied = client.options(
        "/api/predict",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert allowed.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    assert denied.headers.get("Access-Control-Allow-Origin") is None


def test_predict_maps_all_six_probabilities_and_pads_once(client, model) -> None:
    response = client.post("/api/predict", json={"text": "I feel loved."})

    assert response.status_code == 200
    body = response.json
    assert body["predicted_emotion"] == "love"
    assert body["confidence"] == pytest.approx(0.55)
    assert list(body["probabilities"]) == list(EMOTION_LABELS)
    assert sum(body["probabilities"].values()) == pytest.approx(1.0)
    assert all(0 <= value <= 1 for value in body["probabilities"].values())
    assert model.calls == 1
    assert model.last_input is not None
    assert model.last_input.shape == (1, 50)
    assert np.all(model.last_input[0, 2:] == 0)


def test_saved_artifacts_produce_a_valid_six_class_prediction() -> None:
    client = artifact_app.test_client()
    health = client.get("/api/health")
    assert health.status_code == 200

    response = client.post(
        "/api/predict",
        json={"text": "I feel so grateful and happy to see you again."},
    )

    assert response.status_code == 200
    probabilities = response.json["probabilities"]
    assert list(probabilities) == list(EMOTION_LABELS)
    assert all(np.isfinite(value) and 0 <= value <= 1 for value in probabilities.values())
    assert sum(probabilities.values()) == pytest.approx(1.0, abs=1e-3)
    assert response.json["predicted_emotion"] == max(
        probabilities, key=probabilities.__getitem__
    )


@pytest.mark.parametrize(
    ("body", "content_type", "message"),
    [
        (b"{", "application/json", "valid JSON"),
        (json.dumps({}).encode(), "application/json", "required"),
        (json.dumps({"text": 12}).encode(), "application/json", "string"),
        (json.dumps({"text": "   "}).encode(), "application/json", "empty"),
        (json.dumps({"text": "x" * 2001}).encode(), "application/json", "2000"),
        (b"[]", "application/json", "JSON object"),
    ],
)
def test_rejects_invalid_requests(client, model, body, content_type, message) -> None:
    response = client.post(
        "/api/predict", data=body, content_type=content_type
    )

    assert response.status_code == 400
    assert message.lower() in response.json["error"].lower()
    assert model.calls == 0


def test_rejects_non_json_content_type(client) -> None:
    response = client.post("/api/predict", data="text=hello")
    assert response.status_code == 415


def test_rejects_oversized_request_body(client) -> None:
    response = client.post(
        "/api/predict",
        data=b"{" + b" " * (16 * 1024),
        content_type="application/json",
    )
    assert response.status_code == 413
    assert response.json == {"error": "Request body is too large."}


def test_unavailable_model_returns_safe_error() -> None:
    app = create_app(StubModel(), StubTokenizer())
    app.config.update(TESTING=True, EMOTION_MODEL=None, EMOTION_TOKENIZER=None)
    client = app.test_client()

    health = client.get("/api/health")
    response = client.post("/api/predict", json={"text": "hello"})

    assert health.status_code == 503
    assert health.json == {"status": "unavailable", "model_loaded": False}
    assert response.status_code == 503
    assert "filesystem" not in response.json["error"].lower()


def test_rejects_invalid_model_probabilities(client, model) -> None:
    model.output = np.array([[0.2, 0.2, 0.2, 0.2, 0.2, 0.2]])
    response = client.post("/api/predict", json={"text": "hello"})

    assert response.status_code == 500
    assert response.json == {"error": "Prediction failed. Please try again."}
