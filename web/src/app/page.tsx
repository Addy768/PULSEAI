import Link from "next/link";
import { Activity, BrainCircuit, GitBranch, Radar, ShieldCheck, Timer, Wrench, Zap } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { Logo } from "@/components/Logo";

const PIPELINE = [
  { step: "01", title: "Understand", body: "AI classifies category, priority, affected system and location from plain-language reports.", icon: BrainCircuit },
  { step: "02", title: "Recall", body: "Searches historical incidents for semantically similar problems at the same site and asset.", icon: Radar },
  { step: "03", title: "Detect", body: "Flags recurring infrastructure issues when similar incidents cluster inside a 30-day window.", icon: Activity },
  { step: "04", title: "Recommend", body: "Suggests a resolution from verified past fixes, with evidence and a confidence score.", icon: Wrench },
  { step: "05", title: "Route", body: "Salesforce Flow assigns the right team and notifies managers for high-impact incidents.", icon: GitBranch },
  { step: "06", title: "Enforce", body: "SLA clocks start on creation. Unanswered incidents escalate automatically.", icon: Timer },
];

const LAYERS = [
  {
    name: "Salesforce Platform",
    items: ["Custom data model", "Apex services + tests", "Lightning Web Components", "Flow automation", "Platform Events", "Permission sets"],
  },
  {
    name: "AI Service",
    items: ["FastAPI", "Incident classification", "Embeddings + similarity", "Anomaly detection", "Copilot tools", "Evaluation loop"],
  },
  {
    name: "Command Center",
    items: ["Next.js + TypeScript", "Three.js network", "Operational KPIs", "Asset health", "AI copilot", "FinOps view"],
  },
];

export default function Home() {
  return (
    <main className="bg-ink-950">
      <nav className="fixed inset-x-0 top-0 z-30 border-b border-line bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#how" className="hover:text-white">Platform</a>
            <a href="#architecture" className="hover:text-white">Architecture</a>
            <a href="#trust" className="hover:text-white">Trust</a>
          </div>
          <Link href="/app" className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-white hover:bg-accent/20">
            Open app
          </Link>
        </div>
      </nav>

      <Hero />

      <section id="how" className="relative border-t border-line py-28">
        <div className="mx-auto max-w-7xl px-6">
          <p className="label text-accent">Incident intelligence</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
            From a store manager&apos;s message to a routed, tracked, explainable incident in seconds.
          </h2>
          <div className="mt-10 rounded-xl border border-line bg-ink-900 p-5 font-mono text-sm">
            <p className="text-slate-500">STORE-104 · Manager report</p>
            <p className="mt-2 text-slate-200">
              &quot;Our POS terminals keep disconnecting every few minutes and the Wi-Fi seems unstable.&quot;
            </p>
            <div className="mt-4 grid gap-x-8 gap-y-1 border-t border-line pt-4 text-xs text-slate-400 sm:grid-cols-3">
              <span>Category <b className="font-normal text-white">Network</b></span>
              <span>Subcategory <b className="font-normal text-white">Wireless connectivity</b></span>
              <span>Priority <b className="font-normal text-warn">High</b></span>
              <span>System <b className="font-normal text-white">POS</b></span>
              <span>Similar (30d) <b className="font-normal text-white">3 incidents</b></span>
              <span>Confidence <b className="font-normal text-accent">91%</b></span>
            </div>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
            {PIPELINE.map(({ step, title, body, icon: Icon }) => (
              <div key={step} className="bg-ink-950 p-6">
                <div className="flex items-center justify-between">
                  <Icon size={18} className="text-accent" />
                  <span className="font-mono text-xs text-slate-600">{step}</span>
                </div>
                <h3 className="mt-6 text-base font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="border-t border-line py-28">
        <div className="mx-auto max-w-7xl px-6">
          <p className="label text-accent">Architecture</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Salesforce runs the workflow. Python runs the intelligence.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {LAYERS.map((layer) => (
              <div key={layer.name} className="panel p-6">
                <h3 className="font-medium text-white">{layer.name}</h3>
                <ul className="mt-5 space-y-2.5">
                  {layer.items.map((i) => (
                    <li key={i} className="flex items-center gap-2.5 font-mono text-xs text-slate-400">
                      <span className="h-1 w-1 rounded-full bg-accent" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-ink-900 p-6 font-mono text-xs leading-relaxed text-slate-400">
{`Monitoring ──► Device_Alert__e ──► Apex trigger ──► Incident__c ──► Flow: route + notify
                                                      │
Store report ───────────────────────────────────────►─┤
                                                      ▼
                                   IncidentTriageService (Apex)
                                     │  classify · dedupe · SLA · recurrence
                                     ▼
                       Named Credential ──► FastAPI AI service
                                              embeddings · similarity · LLM`}
          </pre>
        </div>
      </section>

      <section id="trust" className="border-t border-line py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
          <div>
            <p className="label text-accent">Human in the loop</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Every AI decision is explainable and reviewable.</h2>
            <p className="mt-5 max-w-md text-slate-400">
              Recommendations ship with reasoning, evidence and confidence. Technicians approve, modify or reject, and that
              feedback is stored to measure model accuracy over time.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-ok" /> Role-based access</span>
              <span className="flex items-center gap-2"><Zap size={16} className="text-warn" /> Event-driven</span>
            </div>
          </div>
          <div className="panel p-6 font-mono text-sm">
            <p className="text-slate-500">Suggested priority</p>
            <p className="mt-1 text-xl text-warn">High</p>
            <p className="mt-5 text-slate-500">Reason</p>
            <p className="mt-1 text-slate-200">POS unavailable at active business location.</p>
            <p className="mt-5 text-slate-500">Evidence</p>
            <p className="mt-1 text-slate-200">3 related incidents during past 30 days.</p>
            <p className="mt-5 text-slate-500">Confidence</p>
            <p className="mt-1 text-accent">91%</p>
            <div className="mt-6 flex gap-2 text-xs">
              <span className="rounded-md bg-ok/15 px-3 py-1.5 text-ok">Approve</span>
              <span className="rounded-md bg-white/5 px-3 py-1.5 text-slate-300">Modify</span>
              <span className="rounded-md bg-crit/10 px-3 py-1.5 text-crit">Reject</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs text-slate-500">
          <Logo size={22} />
          <span className="font-mono">Demo data · Built on Salesforce, FastAPI and Next.js</span>
        </div>
      </footer>
    </main>
  );
}
