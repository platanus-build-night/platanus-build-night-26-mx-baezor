import { useEffect, useState } from "react";
import { fetchSettings, saveSettings } from "../api.ts";
import { DEFAULT_SETTINGS, type Settings } from "../types.ts";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { Toggle } from "../components/Toggle.tsx";
import { Collapsible } from "../components/Collapsible.tsx";
import { ProvidersCard } from "../components/ProvidersCard.tsx";
import { Preview } from "../components/Preview.tsx";

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function AjustesSection() {
  // Seed with the engine's default shape so the screen renders fully even
  // before — or without — a successful GET /settings.
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((s) => {
        if (active) setSettings(s);
      })
      .catch((e: unknown) => {
        if (active) {
          setLoadError(
            e instanceof Error ? e.message : "No se pudo cargar la configuración."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Editing any control clears a previous "guardado" badge.
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSave({ kind: "idle" });
  }

  async function onSave() {
    setSave({ kind: "saving" });
    try {
      const updated = await saveSettings(settings);
      setSettings(updated); // reflect the returned (merged) settings
      setSave({ kind: "saved" });
    } catch (e) {
      setSave({
        kind: "error",
        message: e instanceof Error ? e.message : "No se pudo guardar.",
      });
    }
  }

  return (
    <main className="container">
      <div className="intro">
        <p className="au-eyebrow">Configuración</p>
        <h2 className="au-h2">Cómo se crea el audio</h2>
        <p className="au-lead">
          Ajusta el tono, el enfoque y la duración de las lecciones. Tus
          cambios se aplican al siguiente audio que generes.
        </p>
      </div>

      {loading && <p className="au-small loading">Cargando configuración…</p>}

      {loadError && (
        <p className="alert alert-warn" role="status">
          No se pudo conectar con el motor. Estás viendo los valores por
          defecto; revisa que el motor esté encendido antes de guardar.
          <span className="alert-detail au-caption"> ({loadError})</span>
        </p>
      )}

      <div className="card">
        <SegmentedControl
          name="tone"
          legend="Tono"
          description="¿Cómo le habla el audio a quien estudia?"
          value={settings.tone}
          onChange={(v) => update("tone", v)}
          options={[
            { value: "formal", label: "Formal" },
            { value: "casual", label: "Casual" },
          ]}
        />

        <SegmentedControl
          name="focus"
          legend="Enfoque"
          description="¿Para qué se está preparando?"
          value={settings.focus}
          onChange={(v) => update("focus", v)}
          options={[
            { value: "repaso", label: "Repaso" },
            { value: "examen", label: "Examen" },
          ]}
        />

        <SegmentedControl
          name="level"
          legend="Nivel"
          description="¿Qué tanto sabe del tema?"
          value={settings.level}
          onChange={(v) => update("level", v)}
          options={[
            { value: "principiante", label: "Principiante" },
            { value: "avanzado", label: "Avanzado" },
          ]}
        />

        <SegmentedControl
          name="duration"
          legend="Duración del audio"
          description="Qué tan largo será cada audio."
          value={settings.duration}
          onChange={(v) => update("duration", v)}
          options={[
            { value: "corto", label: "Corto", hint: "≈ 2 min" },
            { value: "medio", label: "Medio", hint: "≈ 4 min" },
          ]}
        />

        <Toggle
          legend="Incluir quiz"
          description="Agrega una pregunta con su respuesta dentro del audio."
          checked={settings.quiz}
          onChange={(v) => update("quiz", v)}
        />
      </div>

      <div className="card">
        <h3 className="au-h4 card-title">Proveedores activos</h3>
        <p className="field-desc au-small">
          Lo que hoy crea tus audios. Se pueden cambiar desde la configuración
          del motor, sin tocar esta pantalla.
        </p>
        <ProvidersCard providers={settings.providers} />
      </div>

      <Collapsible
        title="Avanzado"
        subtitle="Para administradores técnicos: edita la instrucción base del sistema."
      >
        <p className="field-desc au-small">
          Esta es la instrucción que recibe el modelo. El motor la combina con
          los ajustes de arriba para armar el audio. Edítala solo si sabes lo
          que haces.
        </p>
        <textarea
          className="textarea textarea-mono"
          rows={10}
          value={settings.systemPrompt ?? ""}
          onChange={(e) => update("systemPrompt", e.target.value)}
          placeholder="Instrucción base del sistema…"
          spellCheck={false}
        />
      </Collapsible>

      <Collapsible
        title="Vista previa"
        subtitle="Escucha un ejemplo con tu configuración actual (requiere el motor encendido)."
      >
        <Preview />
      </Collapsible>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={save.kind === "saving" || loading || loadError !== null}
        >
          {save.kind === "saving" ? "Guardando…" : "Guardar"}
        </button>
        {save.kind === "saved" && (
          <span className="save-badge save-ok" role="status">
            Cambios guardados
          </span>
        )}
        {save.kind === "error" && (
          <span className="save-badge save-err" role="alert">
            {save.message}
          </span>
        )}
      </div>
    </main>
  );
}
