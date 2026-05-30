interface TopbarProps {
  title: string;
}

// Sticky top bar: active section title on the left; institution name, plan
// pill and an initials avatar on the right.
export function Topbar({ title }: TopbarProps) {
  return (
    <header className="shell-topbar">
      <h1 className="shell-topbar-title au-h3">{title}</h1>
      <div className="shell-topbar-right">
        <span className="shell-institution au-small">Instituto Politécnico del Valle</span>
        <span className="shell-plan-pill">Plan Institucional</span>
        <span className="shell-avatar" aria-hidden="true">AR</span>
      </div>
    </header>
  );
}
