# EmotionAI

EmotionAI is a responsive text emotion dashboard powered by the existing locally saved Bidirectional GRU model. It loads the model and tokenizer from `Artifacts/` and does not train, replace, or move either artifact.

## Verified model labels

The notebook loads `dair-ai/emotion` and builds `label_names` from the training dataset's label feature. That feature's verified class order is:

| Output index | Emotion |
| --- | --- |
| 0 | sadness |
| 1 | joy |
| 2 | love |
| 3 | anger |
| 4 | fear |
| 5 | surprise |

The saved model has six output units. The API and UI preserve that order and report all six probabilities.

## Requirements

- Windows 10/11 and PowerShell
- Python 3.10–3.12 with pip
- Node.js 22.12+ (or 24+)
- Existing files `Artifacts\BiGRU_model.keras` and `Artifacts\tokenizer.pkl`

TensorFlow's native Windows support is CPU-only for current releases. The API still uses the existing model; training and GPU setup are not part of this app.

## Start the backend

From the project root, create and activate a virtual environment, then install the API dependencies:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

Start Flask in terminal 1:

```powershell
python main.py
```

Debug mode is off by default. If you explicitly want Flask's local debug reloader, set `FLASK_DEBUG=1` in that terminal before starting the server. The API listens at `http://127.0.0.1:5000`.

Check readiness at <http://127.0.0.1:5000/api/health>. A healthy response is:

```json
{"status":"ok","model_loaded":true}
```

## Start the frontend

In a second PowerShell terminal:

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the local URL printed by Vite (normally <http://localhost:5173>). Set `VITE_API_BASE_URL` in `frontend\.env` if the backend uses a different URL; restart Vite after changing environment variables. For a different frontend origin, set `FRONTEND_ORIGIN` in the backend terminal to that exact origin. Flask-CORS allows only the configured origin.

## API examples

PowerShell request:

```powershell
$body = @{ text = "I am feeling really happy today!" } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/predict `
  -Method Post -ContentType "application/json" -Body $body
```

Equivalent curl:

```powershell
curl.exe -X POST http://127.0.0.1:5000/api/predict `
  -H "Content-Type: application/json" `
  --data-raw '{"text":"I am feeling really happy today!"}'
```

Prediction responses contain the original text, the highest-scoring emotion, its confidence score, and all six class probabilities. Input must be a non-whitespace string of at most 2,000 characters. API documentation is available at <http://127.0.0.1:5000/api/docs>.

## Tests and production build

Backend tests:

```powershell
python -m pip install pytest
python -m pytest backend\tests -q
```

Frontend tests and production build:

```powershell
Set-Location frontend
npm test
npm run build
```

The API tests cover input validation, class order, single-call inference, padding, probability bounds/sum, and unavailable/invalid model responses. Frontend tests cover API readiness, empty input, successful six-class results, session history, clear/example controls, and backend failure with text preservation.

## Privacy and behavior

Recent analyses remain in React memory for the current page session only and are not written to local storage. The API sends input to the local Flask service and does not persist it. Model confidence is a score, not a guarantee that the classification is correct.
