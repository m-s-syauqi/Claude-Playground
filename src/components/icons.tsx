type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function WalletIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3" />
      <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <path d="M21 12h-4a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
export function ListIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}
export function GearIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
export function EyeIcon({ className = "h-5 w-5", off = false }: P & { off?: boolean }) {
  return (
    <svg {...base} className={className}>
      {off ? (
        <>
          <path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-10-8-10-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.2 3.2" />
          <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}
export function ChevronRight({ className = "h-4 w-4" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
export function ChevronLeft({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
export function PlusIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function BackspaceIcon({ className = "h-6 w-6" }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="M18 9l-6 6M12 9l6 6" />
    </svg>
  );
}
