import { StatCard } from "../components/StatCard.tsx";
import { DataTable } from "../components/DataTable.tsx";
import { BarChart } from "../components/BarChart.tsx";
import { INICIO_STATS, ACTIVIDAD_RECIENTE, AUDIOS_POR_SEMANA } from "../mockData.ts";

// Landing dashboard: KPI tiles, a recent-activity mini table and a weekly
// audios bar chart.
export function InicioSection() {
  return (
    <main className="shell-main">
      <header className="sec-head">
        <p className="au-eyebrow">Resumen</p>
        <h2 className="au-h2">Vista general del instituto</h2>
        <p className="au-lead">Cómo va el aprendizaje por audio esta semana.</p>
      </header>

      <div className="stat-grid">
        {INICIO_STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="panel-grid">
        <section className="panel">
          <h3 className="au-h4 panel-title">Actividad reciente</h3>
          <DataTable
            columns={[
              { key: "quien", label: "Quién" },
              { key: "accion", label: "Acción" },
              { key: "cuando", label: "Cuándo", align: "right" },
            ]}
            rows={ACTIVIDAD_RECIENTE.map((a) => ({
              quien: <strong>{a.quien}</strong>,
              accion: a.accion,
              cuando: <span className="au-caption">{a.cuando}</span>,
            }))}
          />
        </section>

        <section className="panel">
          <h3 className="au-h4 panel-title">Audios por semana</h3>
          <BarChart data={AUDIOS_POR_SEMANA} />
        </section>
      </div>
    </main>
  );
}
