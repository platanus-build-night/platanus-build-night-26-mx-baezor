interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  description?: string;
  options: ReadonlyArray<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  name: string;
}

// Plain-language choice control: looks like friendly buttons, behaves like a
// radio group. Big tap targets, ≥16px text — built for non-technical users.
export function SegmentedControl<T extends string>({
  legend,
  description,
  options,
  value,
  onChange,
  name,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="field">
      <legend className="field-legend">{legend}</legend>
      {description && <p className="field-desc au-small">{description}</p>}
      <div className="segmented" role="radiogroup" aria-label={legend}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <label
              key={opt.value}
              className={`segment${selected ? " segment-on" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
              />
              <span className="segment-label">{opt.label}</span>
              {opt.hint && <span className="segment-hint">{opt.hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
