import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";

import { PIN_COLOR, URGENCY_COLOR } from "@/lib/nirvaan";

export type PinFilter =
  | "sos"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "volunteer"
  | "group"
  | "ngo";

export const ALL_FILTERS: PinFilter[] = [
  "sos",
  "critical",
  "high",
  "medium",
  "low",
  "volunteer",
  "group",
  "ngo",
];

const COLORS: Record<PinFilter, string> = {
  sos: PIN_COLOR.sos,
  critical: URGENCY_COLOR["critical"]!,
  high: URGENCY_COLOR["high"]!,
  medium: URGENCY_COLOR["medium"]!,
  low: URGENCY_COLOR["low"]!,
  volunteer: PIN_COLOR.volunteer,
  group: PIN_COLOR.group,
  ngo: PIN_COLOR.ngo,
};

export type MapLegendProps = {
  active: PinFilter[];
  onToggle: (filter: PinFilter) => void;
  onReset: () => void;
  visibleCount: number;
};

export function MapLegend({ active, onToggle, onReset, visibleCount }: MapLegendProps) {
  const { t } = useTranslation();
  const isActive = (filter: PinFilter) => active.includes(filter);
  const allActive = active.length === ALL_FILTERS.length;

  const label = (filter: PinFilter) => {
    if (filter === "sos") return t("pins.sos");
    if (filter === "volunteer") return t("pins.volunteer");
    if (filter === "group") return t("pins.group");
    if (filter === "ngo") return t("pins.ngo");
    return t(`urgency.${filter}`);
  };

  const row = (filter: PinFilter, extraClass = "") => (
    <li key={filter} className={extraClass}>
      <button
        type="button"
        aria-pressed={isActive(filter)}
        onClick={() => onToggle(filter)}
        className={`flex w-full items-center gap-2 rounded-md border px-1.5 py-1 text-left transition-colors ${
          isActive(filter)
            ? "border-transparent bg-secondary font-medium opacity-100"
            : "border-border bg-transparent text-muted-foreground opacity-60 hover:opacity-90"
        }`}
      >
        <span
          className={filter === "ngo" ? "size-2.5 shrink-0 rounded-sm" : "size-2.5 shrink-0 rounded-full"}
          style={{ background: COLORS[filter] }}
        />
        {label(filter)}
      </button>
    </li>
  );

  return (
    <div className="pointer-events-auto w-56 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
          <span className="size-2 animate-pulse rounded-full bg-low" />
          {t("map.live")} · {visibleCount} {t("map.requests")}
        </p>
        {allActive ? null : (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold hover:bg-muted"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            {t("filters.showAll")}
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {row("sos")}
        {row("critical")}
        {row("high")}
        {row("medium")}
        {row("low")}
        {row("volunteer", "pt-1")}
        {row("group")}
        {row("ngo")}
      </ul>
    </div>
  );
}

/** Toggle helper: deselecting the last filter falls back to showing everything. */
export function toggleFilter(active: PinFilter[], filter: PinFilter): PinFilter[] {
  const isAll = active.length === ALL_FILTERS.length;
  if (isAll) return [filter];
  const next = active.includes(filter)
    ? active.filter((item) => item !== filter)
    : [...active, filter];
  return next.length === 0 ? [...ALL_FILTERS] : next;
}
