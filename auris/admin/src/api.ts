import type { GenerateResponse, Settings } from "./types.ts";

// Engine base URL from env, with the contract default.
export const ENGINE_URL =
  import.meta.env.VITE_ENGINE_URL ?? "http://localhost:3000";

// GET current settings.json from the engine.
export async function fetchSettings(): Promise<Settings> {
  const res = await fetch(`${ENGINE_URL}/settings`);
  if (!res.ok) {
    throw new Error(`No se pudo cargar la configuración (HTTP ${res.status}).`);
  }
  return (await res.json()) as Settings;
}

// PUT settings — engine merges + persists, returns the updated settings.
export async function saveSettings(settings: Settings): Promise<Settings> {
  const res = await fetch(`${ENGINE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    throw new Error(`No se pudo guardar (HTTP ${res.status}).`);
  }
  return (await res.json()) as Settings;
}

// Optional "Vista previa" — POST short text to /generate (JSON mode).
// The engine merges active settings.json as the base.
export async function generatePreview(text: string): Promise<GenerateResponse> {
  const res = await fetch(`${ENGINE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.code) detail = body.error.code;
    } catch {
      // ignore parse failure; keep the HTTP-based detail
    }
    throw new Error(`No se pudo generar la vista previa (${detail}).`);
  }
  return (await res.json()) as GenerateResponse;
}
