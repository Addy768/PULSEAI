"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { getKpis, getLocationProfile } from "@/lib/analytics";
import { HEALTH_COLOR, StatusDot } from "@/components/ui";
import type { Location } from "@/lib/types";

const OpsNetwork = dynamic(() => import("./OpsNetwork"), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

const kpis = getKpis();

const STATS = [
  { label: "Locations online", value: `${kpis.locationsOnline}`, suffix: ` / ${kpis.locationsTotal}`, tone: "text-ok" },
  { label: "Critical incidents", value: `${kpis.criticalIncidents}`, tone: "text-crit" },
  { label: "SLA compliance", value: `${kpis.slaCompliance}%`, tone: "text-white" },
  { label: "Assets at risk", value: `${kpis.assetsAtRisk}`, tone: "text-warn" },
];

function NodeCard({ location, onClose }: { location: Location; onClose: () => void }) {
  const p = getLocationProfile(location.id);
  return (
    <div className="glass w-72 animate-fade-up rounded-xl p-4 shadow-2xl shadow-black/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{location.code}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{location.name}</h3>
          <p className="text-xs text-slate-400">
            {location.city} · {location.region}
          </p>
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
        <div>
          <dt className="text-slate-500">Incidents (30d)</dt>
          <dd className="mt-0.5 text-base text-white">{p.total}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Health</dt>
          <dd className="mt-0.5 text-base" style={{ color: HEALTH_COLOR[location.health] }}>
            {location.healthScore}%
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Assets at risk</dt>
          <dd className="mt-0.5 text-base text-white">{p.atRisk.length}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Downtime risk</dt>
          <dd className="mt-0.5 text-base text-white">{p.downtimeRisk}</dd>
        </div>
      </dl>
      {p.categories[0] && (
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-slate-300">
          {p.categories[0].share}% of incidents are {p.categories[0].category.toLowerCase()}
          {p.topSubcategory ? `, mostly ${p.topSubcategory.toLowerCase()}` : ""}.
        </p>
      )}
    </div>
  );
}

export function Hero() {
  const [selected, setSelected] = useState<Location | null>(null);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]" />

      <div className="absolute inset-0 lg:left-[38%]">
        <OpsNetwork selectedId={selected?.id} onSelect={setSelected} />
      </div>

      <div className="pointer-events-none relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-6 pb-24 pt-32">
        <div className="pointer-events-auto max-w-xl">
          <p className="label flex items-center gap-2 text-accent">
            <StatusDot health="healthy" pulse /> Live operations network
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Operational intelligence for every location.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">
            Pulse AI unifies incidents, assets and SLAs across every store, clinic and warehouse, then uses AI to triage
            problems, detect recurring failures and predict maintenance before downtime hits.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-[#5A9DFF]"
            >
              Launch Command Center
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="rounded-lg border border-line px-5 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              How it works
            </a>
          </div>
        </div>

        <dl className="pointer-events-auto mt-16 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-ink-950/80 px-4 py-4 backdrop-blur">
              <dt className="label text-[10px]">{s.label}</dt>
              <dd className={`mt-2 font-mono text-2xl tabular-nums ${s.tone}`}>
                {s.value}
                {s.suffix && <span className="text-sm text-slate-500">{s.suffix}</span>}
              </dd>
            </div>
          ))}
        </dl>
        <p className="pointer-events-none mt-4 font-mono text-[11px] text-slate-500">
          Drag to rotate. Click a node to inspect a location.
        </p>
      </div>

      {selected && (
        <div className="absolute bottom-8 right-6 z-10 md:right-10">
          <NodeCard location={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </section>
  );
}
