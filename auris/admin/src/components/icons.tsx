// Inline SVG icons for the dashboard shell. Each is a 24×24 stroke icon that
// inherits color via currentColor and accepts an optional className (applied to
// the <svg>) so callers can size/position it (e.g. .shell-nav-icon).

interface IconProps {
  className?: string;
}

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconHome({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function IconStudents({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 8v6" />
    </svg>
  );
}

export function IconAgents({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M12 8V4.5" />
      <circle cx="12" cy="3.5" r="1.2" />
      <path d="M9.5 12.5h.01M14.5 12.5h.01" />
      <path d="M1.5 12.5v3M22.5 12.5v3" />
    </svg>
  );
}

export function IconChannels({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M7.8 7.8 10.6 16M16.2 7.8 13.4 16M8.5 6h7" />
    </svg>
  );
}

export function IconAnalytics({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 20v-6M13 20V8M18 20v-9" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3" />
    </svg>
  );
}
