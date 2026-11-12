"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, ClipboardCheck, Terminal } from "lucide-react";
import { askCopilot, type CopilotContext, type CopilotReply } from "@/lib/copilot";
import { byId } from "@/lib/data";
import { Panel } from "@/components/ui";
import type { MaintenanceTask } from "@/lib/types";

type Message = { role: "user"; text: string } | { role: "assistant"; reply: CopilotReply };

const SUGGESTIONS = [
  "Which locations are having the most recurring IT problems this month?",
  "What is causing Store 104's problems?",
  "Create a maintenance task for the infrastructure team.",
  "Which assets are most likely to fail?",
  "How are we tracking on SLA?",
];

function AssistantMessage({ reply }: { reply: CopilotReply }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
        <Bot size={14} />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {reply.toolCalls.length > 0 && (
          <div className="space-y-1">
            {reply.toolCalls.map((t, idx) => (
              <p key={idx} className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                <Terminal size={11} className="text-accent" />
                {t.name}({Object.entries(t.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ")})
              </p>
            ))}
          </div>
        )}
        <p className="text-sm leading-relaxed text-slate-200">{reply.text}</p>
        {reply.rows && reply.rows.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-line">
            {reply.rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4 border-b border-line bg-ink-850 px-3 py-2 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{r.label}</p>
                  {r.hint && <p className="truncate text-xs text-slate-500">{r.hint}</p>}
                </div>
                <span className="shrink-0 font-mono text-sm text-white">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CopilotView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ctx, setCtx] = useState<CopilotContext>({});
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function send(text: string) {
    if (!text.trim()) return;
    const { reply, ctx: next } = askCopilot(text, ctx);
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", reply }]);
    setCtx(next);
    if (reply.task) setTasks((t) => [reply.task!, ...t]);
    setInput("");
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 xl:grid-cols-[1fr_340px]">
      <section className="panel flex h-[calc(100vh-7.5rem)] flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <p className="label">AI operations copilot</p>
            <p className="mt-0.5 text-xs text-slate-500">Queries live operational records and takes actions through tools.</p>
          </div>
          {ctx.locationId && (
            <span className="rounded-md bg-accent/10 px-2 py-1 font-mono text-[11px] text-accent">
              context: {byId.location(ctx.locationId).code}
            </span>
          )}
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="mx-auto max-w-lg pt-10 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <Bot size={20} />
              </div>
              <h1 className="mt-4 text-lg font-medium text-white">Ask about any location, asset or incident.</h1>
              <div className="mt-6 space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-lg border border-line bg-ink-850 px-4 py-2.5 text-left text-sm text-slate-300 transition hover:border-accent/40 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, idx) =>
            m.role === "user" ? (
              <div key={idx} className="flex justify-end">
                <p className="max-w-[75%] rounded-xl rounded-br-sm bg-accent/15 px-4 py-2.5 text-sm text-white">{m.text}</p>
              </div>
            ) : (
              <AssistantMessage key={idx} reply={m.reply} />
            ),
          )}
          <div ref={end} />
        </div>

        {messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-5 pb-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-slate-400 hover:text-white">
                {s.length > 44 ? `${s.slice(0, 44)}...` : s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-line p-3"
        >
          <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900 px-3 py-2 focus-within:border-accent/50">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the copilot..."
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button type="submit" className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white disabled:opacity-40" disabled={!input.trim()} aria-label="Send">
              <ArrowUp size={15} />
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-5">
        <Panel title="Tasks created this session" action={<ClipboardCheck size={14} className="text-accent" />}>
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500">Tasks the copilot creates appear here and sync to Maintenance_Task__c.</p>
          ) : (
            <ul className="space-y-2.5">
              {tasks.map((t) => (
                <li key={t.id} className="rounded-lg border border-line bg-ink-850 p-3">
                  <p className="font-mono text-[11px] text-accent">{t.id} · {t.type}</p>
                  <p className="mt-1 text-sm text-slate-200">{t.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{t.team} · {byId.location(t.locationId).name}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Available tools">
          <ul className="space-y-2 font-mono text-[11px] text-slate-400">
            {["query_incidents", "summarize_location", "list_assets_at_risk", "get_sla_status", "create_maintenance_task"].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-accent" />{t}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
