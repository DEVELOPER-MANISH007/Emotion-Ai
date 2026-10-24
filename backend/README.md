# EmotionAI backend

The Flask API loads the existing `Artifacts/BiGRU_model.keras` and
`Artifacts/tokenizer.pkl` once at startup. The class order was verified from the
training notebook's dataset feature metadata:

| Model index | Emotion |
| --- | --- |
| 0 | sadness |
| 1 | joy |
| 2 | love |
| 3 | anger |
| 4 | fear |
| 5 | surprise |

See the project [README](../README.md) for Windows setup and API examples.
