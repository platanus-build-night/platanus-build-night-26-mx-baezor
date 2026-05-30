import type { Providers } from "../types.ts";

interface ProvidersCardProps {
  providers: Providers;
}

const ROWS: ReadonlyArray<{ key: keyof Providers; label: string }> = [
  { key: "llm", label: "Modelo de lenguaje" },
  { key: "tts", label: "Voz (texto a voz)" },
  { key: "storage", label: "Almacenamiento" },
];

// Read-only view of the active providers, each tagged "intercambiable".
// The educator can see what powers Auris; swapping happens via config, not here.
export function ProvidersCard({ providers }: ProvidersCardProps) {
  return (
    <div className="providers">
      {ROWS.map(({ key, label }) => (
        <div key={key} className="provider-row">
          <span className="provider-label au-small">{label}</span>
          <span className="provider-value">
            <code className="au-code">{providers[key]}</code>
            <span className="provider-tag">intercambiable</span>
          </span>
        </div>
      ))}
    </div>
  );
}
