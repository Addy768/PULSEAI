import { assets, byId } from "@/lib/data";
import { KpiCard } from "@/components/app/KpiCard";
import { Panel, RiskBar } from "@/components/ui";

export default function AssetsPage() {
  const sorted = [...assets].sort((a, b) => b.risk - a.risk);
  const atRisk = assets.filter((a) => a.risk >= 70);
  const byType = new Map<string, { count: number; risk: number }>();
  for (const a of assets) {
    const t = byType.get(a.type) ?? { count: 0, risk: 0 };
    byType.set(a.type, { count: t.count + 1, risk: t.risk + a.risk });
  }
  const totalDowntime = Math.round(assets.reduce((s, a) => s + a.downtimeHours, 0));

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <p className="label">Asset health</p>
        <h1 className="mt-1 text-xl font-semibold text-white">Predictive maintenance</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Tracked assets" value={assets.length} />
        <KpiCard label="High failure risk" value={atRisk.length} hint="Probability ≥ 70% in 30 days" tone="crit" />
        <KpiCard label="Downtime logged" value={totalDowntime} suffix="h" hint="Last 90 days" />
        <KpiCard label="Overdue service" value={assets.filter((a) => a.daysSinceMaintenance > 365).length} hint="> 365 days since maintenance" tone="warn" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel title="Failure risk ranking">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="label border-b border-line text-[10px]">
                  <th className="pb-2 font-normal">Asset</th>
                  <th className="pb-2 font-normal">Type</th>
                  <th className="pb-2 font-normal">Location</th>
                  <th className="pb-2 text-right font-normal">Age</th>
                  <th className="pb-2 text-right font-normal">Failures</th>
                  <th className="pb-2 text-right font-normal">Last service</th>
                  <th className="pb-2 pl-6 font-normal">30d failure risk</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 40).map((a) => (
                  <tr key={a.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5 font-mono text-xs text-slate-200">{a.tag}</td>
                    <td className="py-2.5 text-slate-400">{a.type}</td>
                    <td className="py-2.5 text-slate-400">{byId.location(a.locationId).name}</td>
                    <td className="py-2.5 text-right font-mono text-xs text-slate-400">{a.ageMonths}mo</td>
                    <td className="py-2.5 text-right font-mono text-xs text-slate-300">{a.failureCount}</td>
                    <td className="py-2.5 text-right font-mono text-xs text-slate-400">{a.daysSinceMaintenance}d</td>
                    <td className="py-2.5 pl-6"><RiskBar value={a.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel title="Average risk by type">
            <ul className="space-y-3">
              {[...byType.entries()]
                .map(([type, v]) => ({ type, avg: Math.round(v.risk / v.count), count: v.count }))
                .sort((a, b) => b.avg - a.avg)
                .map((t) => (
                  <li key={t.type} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{t.type} <span className="text-xs text-slate-600">({t.count})</span></span>
                    <RiskBar value={t.avg} />
                  </li>
                ))}
            </ul>
          </Panel>
          <Panel title="Model">
            <p className="text-xs leading-relaxed text-slate-400">
              Risk combines asset age, failure count, downtime and days since maintenance. Phase 3 replaces this baseline with an
              XGBoost model served from the FastAPI service, writing scores back to <span className="font-mono text-slate-300">Ops_Asset__c.Risk_Score__c</span>.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
