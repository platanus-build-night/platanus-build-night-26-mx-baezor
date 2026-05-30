interface Bar {
  label: string;
  value: number;
}

interface BarChartProps {
  data: Bar[];
}

// Vertical CSS-height bars, max-normalized so the tallest fills the track.
// Clay bars, caption labels.
export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="barchart">
      {data.map((d) => (
        <div key={d.label} className="barchart-col">
          <span className="barchart-value">{d.value.toLocaleString("es-MX")}</span>
          <div
            className="barchart-bar"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value.toLocaleString("es-MX")}`}
          />
          <span className="barchart-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
