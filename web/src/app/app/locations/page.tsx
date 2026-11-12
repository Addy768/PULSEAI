import { getLocationProfile } from "@/lib/analytics";
import { locations } from "@/lib/data";
import { HEALTH_COLOR, StatusDot } from "@/components/ui";

export default function LocationsPage() {
  const regions = [...new Set(locations.map((l) => l.region))];
  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <p className="label">Locations</p>
        <h1 className="mt-1 text-xl font-semibold text-white">{locations.length} sites across {regions.length} regions</h1>
      </div>
      {regions.map((region) => (
        <section key={region}>
          <h2 className="label mb-3">{region}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {locations
              .filter((l) => l.region === region)
              .sort((a, b) => a.healthScore - b.healthScore)
              .map((l) => {
                const p = getLocationProfile(l.id);
                return (
                  <article key={l.id} className="panel p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusDot health={l.health} pulse={l.health === "critical"} />
                        <h3 className="text-sm font-medium text-white">{l.name}</h3>
                      </div>
                      <span className="font-mono text-xs" style={{ color: HEALTH_COLOR[l.health] }}>{l.healthScore}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{l.city} · {l.online ? "Online" : "Offline"}</p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-700">
                      <div className="h-full rounded-full" style={{ width: `${l.healthScore}%`, background: HEALTH_COLOR[l.health] }} />
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                      <div><dt className="text-slate-500">30d</dt><dd className="text-slate-200">{p.total}</dd></div>
                      <div><dt className="text-slate-500">Open</dt><dd className="text-slate-200">{p.open}</dd></div>
                      <div><dt className="text-slate-500">At risk</dt><dd className="text-slate-200">{p.atRisk.length}</dd></div>
                    </dl>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
