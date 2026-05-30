import { StatCard } from "../components/StatCard.tsx";
import { BarChart } from "../components/BarChart.tsx";
import { Sparkline } from "../components/Sparkline.tsx";
import { DataTable } from "../components/DataTable.tsx";
import {
  ANALITICA_STATS,
  AUDIOS_POR_MATERIA,
  ESCUCHAS_14D,
  PROGRESO_COHORTES,
} from "../mockData.ts";

// Analytics view: KPI tiles, audios-por-materia bar chart, a 14-day listens
// sparkline and a per-cohort completion table.
export function AnaliticaSection() {
  return (
    <main className="shell-main">
      <header className="sec-head">
        <p className="au-eyebrow">Métricas</p>
        <h2 className="au-h2">Analítica y progreso</h2>
        <p className="au-lead">Cómo se usan y completan los audios en el instituto.</p>
      </header>

      <div className="stat-grid">
        {ANALITICA_STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="panel-grid">
        <section className="panel">
          <h3 className="au-h4 panel-title">Audios por materia</h3>
          <BarChart data={AUDIOS_POR_MATERIA} />
        </section>

        <section className="panel">
          <h3 className="au-h4 panel-title">Escuchas (últimos 14 días)</h3>
          <div className="spark-large">
            <Sparkline data={ESCUCHAS_14D} className="spark-large-svg" />
          </div>
        </section>
      </div>

      <section className="panel panel-full">
        <h3 className="au-h4 panel-title">Progreso por cohorte</h3>
        <DataTable
          columns={[
            { key: "cohorte", label: "Cohorte" },
            { key: "estudiantes", label: "Estudiantes", align: "right" },
            { key: "finalizacion", label: "Finalización" },
          ]}
          rows={PROGRESO_COHORTES.map((c) => ({
            cohorte: <strong>{c.cohorte}</strong>,
            estudiantes: c.estudiantes,
            finalizacion: (
              <div className="progress-wrap">
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${c.finalizacion}%` }} />
                </div>
                <span className="au-caption progress-pct">{c.finalizacion}%</span>
              </div>
            ),
          }))}
        />
      </section>
    </main>
  );
}
