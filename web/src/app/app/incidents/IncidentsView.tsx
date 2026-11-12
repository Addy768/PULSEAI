"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { NOW, byId, incidents } from "@/lib/data";
import { formatDuration, timeAgo } from "@/lib/analytics";
import { IncidentTable, STATUS_COLOR } from "@/components/app/IncidentTable";
import { Panel, PriorityBadge } from "@/components/ui";
import type { Category, Incident, Priority, ReviewStatus } from "@/lib/types";

const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];
const CATEGORIES: Category[] = ["Network", "POS", "Hardware", "Accounts", "Facilities"];
const VIEWS = ["Open", "Escalated", "Recurring", "Resolved", "All"] as const;

function Select<T extends string>({ value, onChange, options, label }: { value: T | ""; onChange: (v: T | "") => void; options: T[]; label: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      className="rounded-lg border border-line bg-ink-900 px-3 py-1.5 text-xs text-slate-300 focus:border-accent/50 focus:outline-none"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Detail({ incident, review, onReview, onClose }: { incident: Incident; review: ReviewStatus; onReview: (r: ReviewStatus) => void; onClose: () => void }) {
  const loc = byId.location(incident.locationId);
  const asset = byId.asset(incident.assetId);
  const ai = incident.ai;
  const slaLeft = Math.round((incident.slaDueAt - (incident.resolvedAt ?? NOW)) / 60_000);

  return (
    <aside className="panel sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <header className="flex items-start justify-between border-b border-line p-4">
        <div>
          <p className="font-mono text-xs text-slate-500">{incident.id} · {incident.source}</p>
          <h2 className="mt-1 font-medium text-white">{incident.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{loc.name} · {loc.city} · {timeAgo(incident.createdAt)}</p>
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Close"><X size={14} /></button>
      </header>
      <div className="space-y-5 p-4 text-sm">
        <p className="rounded-lg bg-ink-850 p-3 text-slate-300">&quot;{incident.description}&quot;</p>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div><dt className="label text-[10px]">Status</dt><dd className={`mt-1 ${STATUS_COLOR[incident.status]}`}>{incident.status}</dd></div>
          <div><dt className="label text-[10px]">Priority</dt><dd className="mt-1"><PriorityBadge priority={incident.priority} /></dd></div>
          <div><dt className="label text-[10px]">Assigned team</dt><dd className="mt-1 text-slate-200">{incident.team}</dd></div>
          <div><dt className="label text-[10px]">Asset</dt><dd className="mt-1 font-mono text-slate-200">{asset?.tag ?? "n/a"}</dd></div>
          <div>
            <dt className="label text-[10px]">SLA</dt>
            <dd className={clsx("mt-1 font-mono", incident.slaBreached ? "text-crit" : "text-ok")}>
              {incident.slaBreached ? "Breached" : incident.resolvedAt ? "Met" : `${formatDuration(Math.max(0, slaLeft))} left`}
            </dd>
          </div>
          <div><dt className="label text-[10px]">Downtime</dt><dd className="mt-1 font-mono text-slate-200">{formatDuration(incident.downtimeMinutes)}</dd></div>
        </dl>

        <section className="rounded-lg border border-accent/25 bg-accent/[0.05] p-4">
          <p className="label flex items-center gap-2 text-accent"><Sparkles size={12} /> AI triage</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
            <div><dt className="text-slate-500">Category</dt><dd className="text-slate-100">{ai.suggestedCategory}</dd></div>
            <div><dt className="text-slate-500">Subcategory</dt><dd className="text-slate-100">{ai.subcategory}</dd></div>
            <div><dt className="text-slate-500">Suggested priority</dt><dd className="text-slate-100">{ai.suggestedPriority}</dd></div>
            <div><dt className="text-slate-500">Affected system</dt><dd className="text-slate-100">{ai.affectedSystem}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">Reason</p>
          <p className="mt-0.5 text-slate-200">{ai.reasoning}</p>
          <p className="mt-3 text-xs text-slate-500">Evidence</p>
          <ul className="mt-1 space-y-1 text-slate-300">
            {ai.evidence.map((e) => <li key={e} className="flex gap-2"><span className="text-accent">›</span>{e}</li>)}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Recommended action</p>
          <p className="mt-0.5 text-slate-200">{ai.action}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full bg-accent" style={{ width: `${ai.confidence}%` }} />
              </div>
              <span className="font-mono text-xs text-accent">{ai.confidence}% confidence</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {([
              ["Approved", "Approve", Check, "bg-ok/15 text-ok hover:bg-ok/25"],
              ["Modified", "Modify", Pencil, "bg-white/5 text-slate-200 hover:bg-white/10"],
              ["Rejected", "Reject", X, "bg-crit/10 text-crit hover:bg-crit/20"],
            ] as const).map(([value, label, Icon, cls]) => (
              <button
                key={value}
                onClick={() => onReview(value)}
                className={clsx("flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition", cls, review === value && "ring-1 ring-current")}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] text-slate-500">Review: {review}. Feedback is stored on AI_Recommendation__c for accuracy evaluation.</p>
        </section>
      </div>
    </aside>
  );
}

export function IncidentsView() {
  const [view, setView] = useState<(typeof VIEWS)[number]>("Open");
  const [priority, setPriority] = useState<Priority | "">("");
  const [category, setCategory] = useState<Category | "">("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewStatus>>({});

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return incidents.filter((i) => {
      if (view === "Open" && i.status === "Resolved") return false;
      if (view === "Escalated" && i.status !== "Escalated") return false;
      if (view === "Recurring" && !i.recurring) return false;
      if (view === "Resolved" && i.status !== "Resolved") return false;
      if (priority && i.priority !== priority) return false;
      if (category && i.category !== category) return false;
      if (term && !`${i.id} ${i.title} ${byId.location(i.locationId).name}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [view, priority, category, q]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <p className="label">Incident queue</p>
        <h1 className="mt-1 text-xl font-semibold text-white">{list.length} incidents</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-line bg-ink-900 p-0.5">
          {VIEWS.map((v) => (
            <button key={v} onClick={() => setView(v)} className={clsx("rounded-md px-3 py-1 text-xs", view === v ? "bg-accent/15 text-white" : "text-slate-400 hover:text-slate-200")}>
              {v}
            </button>
          ))}
        </div>
        <Select value={priority} onChange={setPriority} options={PRIORITIES} label="All priorities" />
        <Select value={category} onChange={setCategory} options={CATEGORIES} label="All categories" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by ID, title, store"
          className="rounded-lg border border-line bg-ink-900 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
        />
      </div>
      <div className={clsx("grid gap-5", selected && "xl:grid-cols-[1fr_420px]")}>
        <Panel>
          <IncidentTable incidents={list.slice(0, 120)} onSelect={setSelected} selectedId={selected?.id} />
          {list.length > 120 && <p className="mt-3 text-center text-xs text-slate-500">Showing 120 of {list.length}</p>}
        </Panel>
        {selected && (
          <Detail
            incident={selected}
            review={reviews[selected.id] ?? selected.ai.review}
            onReview={(r) => setReviews((s) => ({ ...s, [selected.id]: r }))}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
