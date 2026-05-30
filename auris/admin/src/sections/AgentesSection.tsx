import { AGENTES, type Agente } from "../mockData.ts";

function estadoPill(estado: Agente["estado"]) {
  return estado === "Activo" ? "pill pill-ok" : "pill pill-warn";
}

// Grid of learning-agent cards: name, materia, status pill and key stats.
export function AgentesSection() {
  return (
    <main className="shell-main">
      <header className="sec-head">
        <p className="au-eyebrow">Automatización</p>
        <h2 className="au-h2">Agentes de aprendizaje</h2>
        <p className="au-lead">
          Cada agente convierte material de una materia en audios para los
          estudiantes.
        </p>
      </header>

      <div className="card-grid">
        {AGENTES.map((a) => (
          <article key={a.id} className="entity-card">
            <div className="entity-card-head">
              <div>
                <h3 className="au-h4 entity-name">{a.nombre}</h3>
                <p className="au-caption entity-sub">{a.materia}</p>
              </div>
              <span className={estadoPill(a.estado)}>{a.estado}</span>
            </div>

            <p className="entity-desc au-small">{a.descripcion}</p>

            <dl className="entity-stats">
              <div>
                <dt className="au-caption">Estudiantes</dt>
                <dd>{a.estudiantes}</dd>
              </div>
              <div>
                <dt className="au-caption">Audios generados</dt>
                <dd>{a.audiosGenerados.toLocaleString("es-MX")}</dd>
              </div>
              <div>
                <dt className="au-caption">Última ejecución</dt>
                <dd>{a.ultimaEjecucion}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </main>
  );
}
