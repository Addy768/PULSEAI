import { NOW, assets, byId, incidents, locations } from "./data";
import { getAssetsAtRisk, getKpis, getLocationProfile, getTopLocations } from "./analytics";
import type { Category, MaintenanceTask, Team } from "./types";

// Phase 1 copilot: deterministic intent routing over the same tools the
// LLM agent will call in Phase 2 (query_incidents, summarize_location,
// create_maintenance_task, list_assets_at_risk, get_sla_status).

export interface ToolCall {
  name: string;
  args: Record<string, string | number>;
}

export interface CopilotReply {
  text: string;
  rows?: { label: string; value: string; hint?: string }[];
  toolCalls: ToolCall[];
  task?: MaintenanceTask;
}

export interface CopilotContext {
  locationId?: string;
}

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/network|wi-?fi|internet|router|connect/i, "Network"],
  [/\bpos\b|payment|terminal/i, "POS"],
  [/hardware|printer|pc\b/i, "Hardware"],
  [/account|password|login/i, "Accounts"],
  [/facilit|hvac|cooler|refrigerat/i, "Facilities"],
];

const TEAM_WORDS: [RegExp, Team][] = [
  [/infra|network/i, "Infrastructure"],
  [/field|tech/i, "Field Tech"],
  [/facilit|hvac/i, "Facilities"],
  [/identity|account/i, "Identity"],
  [/service desk|help ?desk/i, "Service Desk"],
];

function windowDays(q: string) {
  if (/today/i.test(q)) return 1;
  if (/week/i.test(q)) return 7;
  if (/quarter|90/i.test(q)) return 90;
  return 30;
}

function findLocation(q: string) {
  const m = q.match(/(?:store|location|site|loc)[\s#-]*(\d{1,4})/i);
  if (!m) return undefined;
  return locations.find((l) => l.code === `STORE-${Number(m[1])}`);
}

function findCategory(q: string) {
  return CATEGORY_WORDS.find(([re]) => re.test(q))?.[1];
}

let taskSeq = 3101;

export function askCopilot(question: string, ctx: CopilotContext): { reply: CopilotReply; ctx: CopilotContext } {
  const q = question.trim();
  const explicitLoc = findLocation(q);
  const loc = explicitLoc ?? (ctx.locationId ? byId.location(ctx.locationId) : undefined);
  const days = windowDays(q);

  if (/create|open|schedule|raise/i.test(q) && /task|maintenance|ticket|work order/i.test(q)) {
    if (!loc) {
      return { reply: { text: "Which location should the maintenance task be for? For example: \"Create a maintenance task for Store 104\".", toolCalls: [] }, ctx };
    }
    const profile = getLocationProfile(loc.id);
    const team = TEAM_WORDS.find(([re]) => re.test(q))?.[1] ?? (profile.categories[0]?.category === "Network" ? "Infrastructure" : "Field Tech");
    const asset = [...profile.assets].sort((a, b) => b.risk - a.risk)[0];
    const lead = profile.categories[0]?.category ?? "General";
    const task: MaintenanceTask = {
      id: `MT-${taskSeq++}`,
      title: `${lead} remediation: ${profile.topSubcategory ?? "recurring issues"} at ${loc.name}`,
      locationId: loc.id,
      assetId: asset?.id,
      team,
      type: "Preventive",
      dueAt: NOW + 3 * 86_400_000,
      createdBy: "Copilot",
    };
    return {
      reply: {
        text: `Created ${task.id} for the ${team} team. Due in 3 days, linked to ${asset?.tag ?? loc.name}.`,
        rows: [
          { label: "Task", value: task.title },
          { label: "Location", value: `${loc.name} (${loc.code})` },
          { label: "Asset", value: asset ? `${asset.tag} · ${asset.risk}% risk` : "n/a" },
          { label: "Assigned", value: team },
        ],
        toolCalls: [{ name: "create_maintenance_task", args: { location: loc.code, team, asset: asset?.tag ?? "", type: "Preventive" } }],
        task,
      },
      ctx: { locationId: loc.id },
    };
  }

  if (!explicitLoc && /which|top|most|worst|rank/i.test(q) && /location|store|site/i.test(q)) {
    const category = findCategory(q);
    const top = getTopLocations(days, 5, category);
    return {
      reply: {
        text: `Locations with the most ${category ? `${category.toLowerCase()} ` : ""}incidents in the last ${days} days:`,
        rows: top.map(({ location, count }) => ({ label: location.name, value: `${count} incidents`, hint: location.city })),
        toolCalls: [{ name: "query_incidents", args: { group_by: "location", days, ...(category ? { category } : {}) } }],
      },
      ctx: top[0] ? { locationId: top[0].location.id } : ctx,
    };
  }

  if (loc && /caus|why|what.*(wrong|happening)|summar|tell me about|problem|issue|status/i.test(q)) {
    const p = getLocationProfile(loc.id, days);
    if (!p.total) {
      return { reply: { text: `${loc.name} has no incidents in the last ${days} days.`, toolCalls: [{ name: "summarize_location", args: { location: loc.code, days } }] }, ctx: { locationId: loc.id } };
    }
    const lead = p.categories[0];
    const riskiest = [...p.assets].sort((a, b) => b.risk - a.risk)[0];
    return {
      reply: {
        text: `${lead.share}% of ${loc.name}'s ${p.total} incidents in the last ${days} days relate to ${lead.category.toLowerCase()}, primarily ${p.topSubcategory?.toLowerCase()}. ${p.open} are still open. The highest-risk asset is ${riskiest.tag} (${riskiest.type}) at ${riskiest.risk}% predicted failure risk.`,
        rows: p.categories.slice(0, 4).map((c) => ({ label: c.category, value: `${c.count} incidents`, hint: `${c.share}%` })),
        toolCalls: [
          { name: "query_incidents", args: { location: loc.code, days } },
          { name: "summarize_location", args: { location: loc.code } },
        ],
      },
      ctx: { locationId: loc.id },
    };
  }

  if (/risk|fail|predict|maintenance/i.test(q)) {
    const list = explicitLoc ? assets.filter((a) => a.locationId === explicitLoc.id).sort((a, b) => b.risk - a.risk).slice(0, 5) : getAssetsAtRisk(5);
    return {
      reply: {
        text: `${explicitLoc ? `At ${explicitLoc.name}, the` : "The"} assets most likely to fail in the next 30 days:`,
        rows: list.map((a) => ({ label: a.tag, value: `${a.risk}%`, hint: `${a.type} · ${byId.location(a.locationId).name}` })),
        toolCalls: [{ name: "list_assets_at_risk", args: { threshold: 70, ...(explicitLoc ? { location: explicitLoc.code } : {}) } }],
      },
      ctx: explicitLoc ? { locationId: explicitLoc.id } : ctx,
    };
  }

  if (/sla|breach|escalat|overdue/i.test(q)) {
    const k = getKpis();
    const breached = incidents.filter((i) => i.status === "Escalated").slice(0, 5);
    return {
      reply: {
        text: `SLA compliance is ${k.slaCompliance}% over 30 days. ${incidents.filter((i) => i.status === "Escalated").length} open incidents have breached SLA and are escalated.`,
        rows: breached.map((i) => ({ label: i.id, value: i.priority, hint: `${byId.location(i.locationId).name} · ${i.title}` })),
        toolCalls: [{ name: "get_sla_status", args: { days: 30 } }],
      },
      ctx,
    };
  }

  return {
    reply: {
      text: "I can rank locations by incidents, explain what is driving problems at a site, list assets likely to fail, report SLA status and create maintenance tasks. Try one of the suggestions below.",
      toolCalls: [],
    },
    ctx,
  };
}
