import { SECTIONS, type SectionId } from "../mockData.ts";

interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

// Fixed left rail: brand mark + wordmark, the six nav sections, and a
// decorative "motor conectado" status footer.
export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="shell-sidebar">
      <div className="shell-brand">
        <img src="/auris-mark.svg" alt="" width={32} height={32} />
        <div className="shell-brand-text">
          <span className="shell-brand-name au-h4">Auris</span>
          <span className="shell-brand-caption au-caption">Admin institucional</span>
        </div>
      </div>

      <nav className="shell-nav" aria-label="Secciones">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === active;
          return (
            <button
              key={section.id}
              type="button"
              className={`shell-nav-item${isActive ? " shell-nav-item-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect(section.id)}
            >
              <Icon className="shell-nav-icon" />
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="shell-status">
        <span className="shell-status-dot" aria-hidden="true" />
        <span>Motor conectado · :3000</span>
      </div>
    </aside>
  );
}
