import { byId } from "@/lib/data";
import { timeAgo } from "@/lib/analytics";
import { PriorityBadge } from "@/components/ui";
import type { Incident } from "@/lib/types";

export const STATUS_COLOR: Record<string, string> = {
  New: "text-accent",
  Triaged: "text-slate-300",
  "In Progress": "text-warn",
  Escalated: "text-crit",
  Resolved: "text-ok",
};

export function IncidentTable({ incidents, onSelect, selectedId }: { incidents: Incident[]; onSelect?: (i: Incident) => void; selectedId?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="label border-b border-line text-[10px]">
            <th className="pb-2 font-normal">ID</th>
            <th className="pb-2 font-normal">Incident</th>
            <th className="pb-2 font-normal">Location</th>
            <th className="pb-2 font-normal">Priority</th>
            <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal">Team</th>
            <th className="pb-2 text-right font-normal">Created</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((i) => (
            <tr
              key={i.id}
              onClick={onSelect ? () => onSelect(i) : undefined}
              className={`border-b border-line/60 last:border-0 ${onSelect ? "cursor-pointer hover:bg-white/[0.02]" : ""} ${selectedId === i.id ? "bg-accent/[0.06]" : ""}`}
            >
              <td className="py-2.5 font-mono text-xs text-slate-500">{i.id}</td>
              <td className="py-2.5 pr-4">
                <span className="text-slate-200">{i.title}</span>
                {i.recurring && <span className="ml-2 rounded bg-warn/10 px-1.5 py-0.5 font-mono text-[10px] text-warn">RECURRING</span>}
              </td>
              <td className="py-2.5 text-slate-400">{byId.location(i.locationId).name}</td>
              <td className="py-2.5"><PriorityBadge priority={i.priority} /></td>
              <td className={`py-2.5 text-xs ${STATUS_COLOR[i.status]}`}>{i.status}</td>
              <td className="py-2.5 text-xs text-slate-400">{i.team}</td>
              <td className="py-2.5 text-right font-mono text-xs text-slate-500">{timeAgo(i.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
