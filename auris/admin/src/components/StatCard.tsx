import { Sparkline } from "./Sparkline.tsx";

interface StatCardProps {
  label: string;
  valor: string;
  delta?: string;
  deltaUp?: boolean;
  trend?: number[];
}

// KPI tile: small label, big Bitter slab number, optional delta chip
// (pine up / danger down) and an optional honey sparkline.
export function StatCard({ label, valor, delta, deltaUp, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{valor}</p>
      {(delta || trend) && (
        <div className="stat-foot">
          {delta && (
            <span className={`stat-delta ${deltaUp ? "stat-delta-up" : "stat-delta-down"}`}>
              {delta}
            </span>
          )}
          {trend && <Sparkline data={trend} className="stat-spark" />}
        </div>
      )}
    </div>
  );
}
