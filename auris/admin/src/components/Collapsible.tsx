import { useState, type ReactNode } from "react";

interface CollapsibleProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

// Collapsible section (WordPress-admin feel). Used for "Avanzado": the educator
// never sees a system prompt unless they choose to open it.
export function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapsible">
      <button
        type="button"
        className="collapsible-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`chevron${open ? " chevron-open" : ""}`} aria-hidden="true">
          ›
        </span>
        <span className="collapsible-titles">
          <span className="collapsible-title au-h4">{title}</span>
          {subtitle && <span className="collapsible-subtitle au-small">{subtitle}</span>}
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
