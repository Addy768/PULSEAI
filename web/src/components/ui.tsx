import clsx from "clsx";
import type { Health, Priority } from "@/lib/types";

export const HEALTH_COLOR: Record<Health, string> = {
  healthy: "#2FD39A",
  warning: "#F5B544",
  critical: "#FF5470",
};

const PRIORITY_STYLE: Record<Priority, string> = {
  Critical: "bg-crit/15 text-crit ring-crit/30",
  High: "bg-warn/15 text-warn ring-warn/30",
  Medium: "bg-accent/15 text-accent ring-accent/30",
  Low: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={clsx("rounded px-1.5 py-0.5 font-mono text-[10.5px] font-medium ring-1 ring-inset", PRIORITY_STYLE[priority])}>
      {priority.toUpperCase()}
    </span>
  );
}

export function StatusDot({ health, pulse }: { health: Health; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && (
        <span className="absolute inset-0 animate-pulse-ring rounded-full" style={{ background: HEALTH_COLOR[health] }} />
      )}
      <span className="relative h-2 w-2 rounded-full" style={{ background: HEALTH_COLOR[health] }} />
    </span>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("panel flex flex-col", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="label">{title}</h2>
          {action}
        </header>
      )}
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

export function RiskBar({ value }: { value: number }) {
  const color = value >= 70 ? "#FF5470" : value >= 45 ? "#F5B544" : "#2FD39A";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-9 text-right font-mono text-xs tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}
