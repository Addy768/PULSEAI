import { Check, Minus } from "lucide-react";
import { getAiAccuracy } from "@/lib/analytics";
import { KpiCard } from "@/components/app/KpiCard";
import { Panel } from "@/components/ui";

const ROLES = ["Store Employee", "Technician", "Manager", "Administrator"] as const;
const PERMISSIONS: { label: string; grant: boolean[] }[] = [
  { label: "Create incidents", grant: [true, true, true, true] },
  { label: "View own location only", grant: [true, false, false, false] },
  { label: "Update incidents", grant: [false, true, true, true] },
  { label: "Manage assets", grant: [false, true, false, true] },
  { label: "Review AI recommendations", grant: [false, true, true, true] },
  { label: "View analytics", grant: [false, false, true, true] },
  { label: "Manage escalation", grant: [false, false, true, true] },
  { label: "Configure SLA policies", grant: [false, false, false, true] },
];
const PERMISSION_SETS = ["Pulse_Store_Employee", "Pulse_Technician", "Pulse_Manager", "Pulse_Administrator"];

export default function AdminPage() {
  const ai = getAiAccuracy();
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <p className="label">Administration</p>
        <h1 className="mt-1 text-xl font-semibold text-white">Access control and AI evaluation</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="AI recommendations reviewed" value={ai.reviewed} />
        <KpiCard label="Accepted as-is" value={`${ai.acceptance}%`} tone="ok" />
        <KpiCard label="Modified by human" value={ai.modified} tone="warn" />
        <KpiCard label="Rejected" value={ai.rejected} tone="crit" />
      </div>

      <Panel title="Role-based access (Salesforce permission sets)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-3 text-left font-normal text-slate-500">Capability</th>
                {ROLES.map((r, i) => (
                  <th key={r} className="pb-3 text-center font-normal">
                    <span className="block text-slate-200">{r}</span>
                    <span className="font-mono text-[10px] text-slate-500">{PERMISSION_SETS[i]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p.label} className="border-b border-line/60 last:border-0">
                  <td className="py-2.5 text-slate-300">{p.label}</td>
                  {p.grant.map((g, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {g ? <Check size={15} className="mx-auto text-ok" /> : <Minus size={15} className="mx-auto text-slate-700" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Location scoping uses a private sharing model on Incident__c with sharing rules by Location__c. Integrations authenticate via
          OAuth through Named Credentials.
        </p>
      </Panel>
    </div>
  );
}
