import clsx from "clsx";

export function KpiCard({
  label,
  value,
  suffix,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "crit";
}) {
  return (
    <div className="panel relative overflow-hidden px-4 py-4">
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-px",
          tone === "ok" && "bg-ok/60",
          tone === "warn" && "bg-warn/60",
          tone === "crit" && "bg-crit/70",
          tone === "default" && "bg-accent/50",
        )}
      />
      <p className="label text-[10px]">{label}</p>
      <p
        className={clsx(
          "mt-3 font-mono text-[28px] leading-none tabular-nums",
          tone === "crit" ? "text-crit" : tone === "warn" ? "text-warn" : "text-white",
        )}
      >
        {value}
        {suffix && <span className="ml-0.5 text-sm text-slate-500">{suffix}</span>}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
