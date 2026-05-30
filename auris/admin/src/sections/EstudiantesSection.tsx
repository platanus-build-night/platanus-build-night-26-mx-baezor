import { useState } from "react";
import { DataTable } from "../components/DataTable.tsx";
import { ESTUDIANTES, COHORTES, type Estudiante } from "../mockData.ts";

function estadoPill(estado: Estudiante["estado"]) {
  if (estado === "Activo") return "pill pill-ok";
  if (estado === "En riesgo") return "pill pill-warn";
  return "pill pill-off";
}

// Roster view: cohort filter chips (visual only), a non-functional
// "Nuevo estudiante" CTA, and the students table with progress bars + pills.
export function EstudiantesSection() {
  const [cohorte, setCohorte] = useState("Todas");

  const visibles = ESTUDIANTES.filter(
    (e) => cohorte === "Todas" || e.cohorte === cohorte
  );

  return (
    <main className="shell-main">
      <header className="sec-head">
        <div className="sec-head-row">
          <div>
            <p className="au-eyebrow">Personas</p>
            <h2 className="au-h2">Estudiantes y cohortes</h2>
          </div>
          <button type="button" className="btn btn-primary">
            Nuevo estudiante
          </button>
        </div>
      </header>

      <div className="chip-row">
        {COHORTES.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${c === cohorte ? " chip-on" : ""}`}
            onClick={() => setCohorte(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "cohorte", label: "Cohorte" },
          { key: "materia", label: "Materia" },
          { key: "progreso", label: "Progreso" },
          { key: "estado", label: "Estado" },
        ]}
        rows={visibles.map((e) => ({
          nombre: <strong>{e.nombre}</strong>,
          cohorte: e.cohorte,
          materia: e.materia,
          progreso: (
            <div className="progress-wrap">
              <div className="progress">
                <div className="progress-fill" style={{ width: `${e.progreso}%` }} />
              </div>
              <span className="au-caption progress-pct">{e.progreso}%</span>
            </div>
          ),
          estado: <span className={estadoPill(e.estado)}>{e.estado}</span>,
        }))}
      />
    </main>
  );
}
