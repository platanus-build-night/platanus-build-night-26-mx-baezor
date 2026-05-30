import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, ReactNode>[];
}

// Generic warm-styled table. Columns drive headers + cell alignment; rows are
// keyed maps of ReactNode so callers can drop in pills, bars, etc.
export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <table className="shell-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ textAlign: col.align ?? "left" }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
