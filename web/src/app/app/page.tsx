import Link from "next/link";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import {
  formatDuration,
  getAssetsAtRisk,
  getCategoryBreakdown,
  getInsights,
  getKpis,
  getTopLocations,
  getTrend,
} from "@/lib/analytics";
import { byId, incidents } from "@/lib/data";
import { IncidentTrend } from "@/components/app/Charts";
import { IncidentTable } from "@/components/app/IncidentTable";
import { KpiCard } from "@/components/app/KpiCard";
import { Panel, RiskBar, StatusDot } from "@/components/ui";

export default function Overview() {
  const k = getKpis();
  const categories = getCategoryBreakdown();
  const top = getTopLocations(30, 5);
  const risky = getAssetsAtRisk(6);
  const insights = getInsights();
  const open = incidents.filter((i) => i.status !== "Resolved").slice(0, 8);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Operations overview</p>
          <h1 className="mt-1 text-xl font-semibold text-white">All locations · last 30 days</h1>
        </div>
        <p className="flex items-center gap-2 font-mono text-xs text-slate-500">
          <StatusDot health="healthy" pulse /> Live
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Locations online" value={k.locationsOnline} suffix={` / ${k.locationsTotal}`} tone="ok" />
        <KpiCard label="Critical incidents" value={k.criticalIncidents} hint={`${k.openIncidents} open total`} tone="crit" />
        <KpiCard label="Avg MTTR" value={formatDuration(k.mttrMinutes)} hint="Resolved, 30d" />
        <KpiCard label="SLA compliance" value={`${k.slaCompliance}%`} hint="Target 95%" tone={k.slaCompliance >= 95 ? "ok" : "warn"} />
        <KpiCard label="Recurring problems" value={k.recurringProblems} hint="Site + category clusters" tone="warn" />
        <KpiCard label="Assets at risk" value={k.assetsAtRisk} hint="Failure risk ≥ 70%" tone="warn" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Incident trend" className="xl:col-span-2">
          <IncidentTrend data={getTrend(30)} />
        </Panel>
        <Panel title="Top issue categories">
          <ul className="space-y-3.5">
            {categories.map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{c.category}</span>
                  <span className="font-mono text-xs text-slate-400">{c.share}% · {c.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full" style={{ width: `${c.share}%`, background: c.color }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Assets at risk" action={<Link href="/app/assets" className="text-xs text-accent hover:underline">View all</Link>}>
          <ul className="divide-y divide-line">
            {risky.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="font-mono text-sm text-slate-200">{a.tag}</p>
                  <p className="text-xs text-slate-500">{a.type} · {byId.location(a.locationId).name}</p>
                </div>
                <RiskBar value={a.risk} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="AI insights" action={<Sparkles size={14} className="text-accent" />}>
          <ul className="space-y-3">
            {insights.map((ins) => (
              <li key={ins.title} className="rounded-lg border border-line bg-ink-850 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  {ins.tone === "info" ? <Info size={14} className="text-accent" /> : <AlertTriangle size={14} className={ins.tone === "crit" ? "text-crit" : "text-warn"} />}
                  {ins.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{ins.body}</p>
              </li>
            ))}
          </ul>
          <Link href="/app/copilot" className="mt-4 block rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-center text-xs text-white hover:bg-accent/20">
            Ask the Copilot
          </Link>
        </Panel>

        <Panel title="Most affected locations">
          <ul className="space-y-2.5">
            {top.map(({ location, count }, idx) => (
              <li key={location.id} className="flex items-center gap-3">
                <span className="w-4 font-mono text-xs text-slate-600">{idx + 1}</span>
                <StatusDot health={location.health} pulse={location.health === "critical"} />
                <span className="flex-1 text-sm text-slate-200">{location.name}</span>
                <span className="text-xs text-slate-500">{location.city}</span>
                <span className="w-16 text-right font-mono text-sm tabular-nums text-white">{count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Open incidents" action={<Link href="/app/incidents" className="text-xs text-accent hover:underline">Open queue</Link>}>
        <IncidentTable incidents={open} />
      </Panel>
    </div>
  );
}
