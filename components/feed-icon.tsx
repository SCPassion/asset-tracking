import { cn } from "@/lib/utils";

type FeedIconProps = {
  symbol: string;
  className?: string;
};

const ICON_COLORS: Record<string, string> = {
  BTC: "#f59e0b",
  ETH: "#a5b4fc",
  SOL: "#5eead4",
  AVAX: "#f87171",
  MATIC: "#c4b5fd",
  ATOM: "#7dd3fc",
  DOT: "#f472b6",
  LINK: "#93c5fd",
  AAPL: "#f8fafc",
  MSFT: "#f8fafc",
  NVDA: "#86efac",
  TSLA: "#fca5a5",
  AMZN: "#fdba74",
  GOOGL: "#bfdbfe",
  EUR: "#93c5fd",
  GBP: "#a5b4fc",
  USD: "#86efac",
  JPY: "#fda4af",
  AUD: "#7dd3fc",
  CAD: "#fca5a5",
  CHF: "#fecaca",
};

const ICON_BG = "#0f172a";
const ICON_RING = "#334155";
const ICON_ACCENT = "#64748b";
const DEFAULT_ICON_COLOR = "#e2e8f0";

function baseTicker(symbol: string): string {
  const pair = symbol.split(" ")[0] ?? symbol;
  const base = pair.split("/")[0] ?? pair;
  return base.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function Glyph({ base, text, color }: { base: string; text: string; color: string }) {
  switch (base) {
    case "BTC":
      return (
        <g>
          <line x1="9.4" y1="6.8" x2="9.4" y2="17.2" stroke={color} strokeWidth="1.1" />
          <line x1="14.6" y1="6.8" x2="14.6" y2="17.2" stroke={color} strokeWidth="1.1" />
          <text
            x="12"
            y="12.4"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8.8"
            fontWeight="700"
            fill={color}
            fontFamily="ui-sans-serif, system-ui, -apple-system"
          >
            B
          </text>
        </g>
      );
    case "ETH":
      return (
        <g fill={color}>
          <polygon points="12,5.1 8.2,11.3 12,13.1 15.8,11.3" />
          <polygon points="12,18.9 8.2,12.6 12,14.5 15.8,12.6" opacity="0.9" />
        </g>
      );
    case "SOL":
      return (
        <g fill={color}>
          <rect x="7.3" y="6.8" width="9.4" height="2.1" rx="1" transform="skewX(-15)" />
          <rect x="7.3" y="10.95" width="9.4" height="2.1" rx="1" transform="skewX(-15)" opacity="0.9" />
          <rect x="7.3" y="15.1" width="9.4" height="2.1" rx="1" transform="skewX(-15)" opacity="0.8" />
        </g>
      );
    case "AAPL":
      return (
        <g fill={color}>
          <ellipse cx="11.1" cy="12.9" rx="3.5" ry="4.4" />
          <ellipse cx="14.1" cy="12.9" rx="3.3" ry="4.2" />
          <circle cx="16.8" cy="11.7" r="1.2" fill={ICON_BG} />
          <ellipse cx="13.8" cy="7.3" rx="1.2" ry="2.1" transform="rotate(35 13.8 7.3)" />
        </g>
      );
    case "MSFT":
      return (
        <g fill={color}>
          <rect x="7.2" y="7.2" width="4.1" height="4.1" rx="0.6" />
          <rect x="12.7" y="7.2" width="4.1" height="4.1" rx="0.6" opacity="0.95" />
          <rect x="7.2" y="12.7" width="4.1" height="4.1" rx="0.6" opacity="0.95" />
          <rect x="12.7" y="12.7" width="4.1" height="4.1" rx="0.6" />
        </g>
      );
    case "NVDA":
      return (
        <g fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
          <path d="M7.2 12c1.6-2.5 3.4-3.8 5.4-3.8 2.2 0 4 1.4 5.2 3.8-1.2 2.4-3 3.8-5.2 3.8-2 0-3.8-1.2-5.4-3.8z" />
          <circle cx="12.4" cy="12" r="1.6" fill={color} stroke="none" />
        </g>
      );
    case "TSLA":
      return (
        <g fill={color}>
          <path d="M7.6 8.1c1.5-1.5 3-2.2 4.4-2.2 1.4 0 2.9.7 4.4 2.2l-1.2 1.4c-1-.9-2.1-1.3-3.2-1.3s-2.2.4-3.2 1.3L7.6 8.1z" />
          <rect x="11.1" y="9.3" width="1.8" height="7.8" rx="0.6" />
        </g>
      );
    case "AMZN":
      return (
        <g fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.1 14.7c.6.7 1.5 1.1 2.7 1.1 1.4 0 2.4-.5 3-1.6v-3.2c-.6-.7-1.5-1.1-2.7-1.1-1.2 0-2.2.4-2.8 1.3" />
          <path d="M7.8 16.2c2.1 1.6 5.3 1.8 8 .4" />
          <path d="M14.6 16.7l1.9-.2-.7 1.7" />
        </g>
      );
    case "GOOGL":
      return (
        <g fill="none" strokeWidth="1.7" strokeLinecap="round">
          <path d="M15.9 9.3a4.6 4.6 0 1 0 0 5.4" stroke="#60a5fa" />
          <path d="M15.9 9.3a4.6 4.6 0 0 0-3.9-1.9" stroke="#fbbf24" />
          <path d="M9.1 13.8a4.6 4.6 0 0 0 2.9 2.5" stroke="#4ade80" />
          <path d="M9.1 10.2a4.6 4.6 0 0 1 2.9-2.8" stroke="#f87171" />
          <path d="M12.3 12h4.1" stroke="#bfdbfe" />
        </g>
      );
    case "EUR":
    case "GBP":
    case "USD":
    case "JPY":
    case "AUD":
    case "CAD":
    case "CHF":
      return (
        <text
          x="12"
          y="12.4"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7.3"
          fontWeight="700"
          fill={color}
          fontFamily="ui-sans-serif, system-ui, -apple-system"
        >
          {base.slice(0, 2)}
        </text>
      );
    default:
      return (
        <text
          x="12"
          y="12.4"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8.3"
          fontWeight="700"
          fill={color}
          fontFamily="ui-sans-serif, system-ui, -apple-system"
        >
          {text}
        </text>
      );
  }
}

export function FeedIcon({ symbol, className }: FeedIconProps) {
  const base = baseTicker(symbol);
  const color = ICON_COLORS[base] ?? DEFAULT_ICON_COLOR;
  const label = base.slice(0, 2) || "?";

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0 rounded-full", className)}
    >
      <circle cx="12" cy="12" r="11" fill={ICON_BG} />
      <circle cx="12" cy="12" r="10.25" fill="none" stroke={ICON_RING} strokeWidth="1.5" />
      <circle cx="7.5" cy="7.5" r="2.2" fill={ICON_ACCENT} opacity="0.9" />
      <Glyph base={base} text={label} color={color} />
    </svg>
  );
}
