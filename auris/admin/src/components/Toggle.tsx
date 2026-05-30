interface ToggleProps {
  legend: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// Sí / no switch for the quiz setting. Accessible (real checkbox underneath).
export function Toggle({ legend, description, checked, onChange }: ToggleProps) {
  return (
    <fieldset className="field">
      <legend className="field-legend">{legend}</legend>
      {description && <p className="field-desc au-small">{description}</p>}
      <label className={`toggle${checked ? " toggle-on" : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
        <span className="toggle-text">{checked ? "Sí" : "No"}</span>
      </label>
    </fieldset>
  );
}
