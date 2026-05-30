import { CANALES, type Canal } from "../mockData.ts";

function estadoPill(estado: Canal["estado"]) {
  return estado === "Conectado" ? "pill pill-ok" : "pill pill-danger";
}

// Grid of channel cards (WhatsApp, LMS/Moodle, MCP, Web) with connection
// status and a headline metric each.
export function CanalesSection() {
  return (
    <main className="shell-main">
      <header className="sec-head">
        <p className="au-eyebrow">Distribución</p>
        <h2 className="au-h2">Canales</h2>
        <p className="au-lead">Por dónde llegan los audios a los estudiantes.</p>
      </header>

      <div className="card-grid">
        {CANALES.map((c) => (
          <article key={c.id} className="entity-card">
            <div className="entity-card-head">
              <div>
                <h3 className="au-h4 entity-name">{c.nombre}</h3>
                <p className="au-caption entity-sub">{c.tipo}</p>
              </div>
              <span className={estadoPill(c.estado)}>{c.estado}</span>
            </div>

            <p className="entity-desc au-small">{c.detalle}</p>

            <div className="entity-metric">
              <span className="au-caption entity-metric-label">{c.metricaLabel}</span>
              <span className="entity-metric-value">{c.metricaValor}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
