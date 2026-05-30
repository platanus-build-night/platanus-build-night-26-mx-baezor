import { useState } from "react";
import { generatePreview } from "../api.ts";
import type { GenerateResponse } from "../types.ts";

const SAMPLE =
  "La fotosíntesis es el proceso por el cual las plantas convierten la luz solar, el agua y el dióxido de carbono en glucosa y oxígeno.";

// Optional "Vista previa" beat: POSTs a short text to /generate and plays the
// returned audio. Uses the active saved settings as the base. Nice-to-have —
// only works when the engine is running with valid provider keys.
export function Preview() {
  const [text, setText] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generatePreview(text.trim());
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="preview">
      <p className="field-desc au-small">
        Pega un texto corto y escucha cómo suena con tu configuración actual.
        Guarda tus cambios antes para que se reflejen.
      </p>
      <textarea
        className="textarea"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe o pega un texto de ejemplo…"
      />
      <div className="preview-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onGenerate}
          disabled={loading || text.trim().length === 0}
        >
          {loading ? "Generando…" : "Generar vista previa"}
        </button>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {result && (
        <div className="preview-result">
          <audio className="preview-audio" controls src={result.audioUrl} />
          <p className="au-caption preview-meta">
            Duración aproximada: {result.durationSec}s
          </p>
          {result.quiz && (
            <div className="preview-quiz">
              <p className="au-small">
                <strong>Quiz:</strong> {result.quiz.question}
              </p>
              <p className="au-small preview-answer">
                <strong>Respuesta:</strong> {result.quiz.answer}
              </p>
            </div>
          )}
          <details className="preview-script">
            <summary className="au-small">Ver guion</summary>
            <p className="au-small">{result.script}</p>
          </details>
        </div>
      )}
    </div>
  );
}
