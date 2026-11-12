import { NOW, assets, byId, incidents, locations } from "./data";
import type { Category, Incident } from "./types";

const DAY = 86_400_000;

export const CATEGORY_COLORS: Record<Category, string> = {
  Network: "#3D8BFF",
  POS: "#8B7CFF",
  Hardware: "#2FC7D3",
  Accounts: "#F5B544",
  Facilities: "#5B6B8C",
};

const within = (days: number) => (i: Incident) => NOW - i.createdAt <= days * DAY;

export function getKpis() {
  const open = incidents.filter((i) => i.status !== "Resolved");
  const resolved30 = incidents.filter((i) => i.resolvedAt && within(30)(i));
  const mttr = resolved30.reduce((s, i) => s + (i.resolvedAt! - i.createdAt), 0) / Math.max(1, resolved30.length) / 60_000;
  const last30 = incidents.filter(within(30));
  const slaMet = last30.filter((i) => !i.slaBreached).length / Math.max(1, last30.length);
  const recurringGroups = new Set(
    incidents.filter((i) => i.recurring && within(30)(i)).map((i) => `${i.locationId}:${i.category}`),
  );
  return {
    locationsOnline: locations.filter((l) => l.online).length,
    locationsTotal: locations.length,
    criticalIncidents: open.filter((i) => i.priority === "Critical").length,
    openIncidents: open.length,
    mttrMinutes: Math.round(mttr),
    slaCompliance: Math.round(slaMet * 100),
    recurringProblems: recurringGroups.size,
    assetsAtRisk: assets.filter((a) => a.risk >= 70).length,
  };
}

export function getTrend(days = 30) {
  const rows: { date: string; total: number; critical: number; resolved: number }[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const start = NOW - (d + 1) * DAY;
    const end = NOW - d * DAY;
    const dayIncidents = incidents.filter((i) => i.createdAt >= start && i.createdAt < end);
    rows.push({
      date: new Date(end).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }),
      total: dayIncidents.length,
      critical: dayIncidents.filter((i) => i.priority === "Critical").length,
      resolved: incidents.filter((i) => i.resolvedAt && i.resolvedAt >= start && i.resolvedAt < end).length,
    });
  }
  return rows;
}

export function getCategoryBreakdown(days = 30) {
  const list = incidents.filter(within(days));
  const counts = new Map<Category, number>();
  for (const i of list) counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      share: Math.round((count / list.length) * 100),
      color: CATEGORY_COLORS[category],
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTopLocations(days = 30, limit = 5, category?: Category) {
  const list = incidents.filter((i) => within(days)(i) && (!category || i.category === category));
  const counts = new Map<string, number>();
  for (const i of list) counts.set(i.locationId, (counts.get(i.locationId) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ location: byId.location(id), count }));
}

export function getAssetsAtRisk(limit = 6) {
  return [...assets].sort((a, b) => b.risk - a.risk).slice(0, limit);
}

export function getLocationProfile(locationId: string, days = 30) {
  const loc = byId.location(locationId);
  const list = incidents.filter((i) => i.locationId === locationId && within(days)(i));
  const byCat = new Map<Category, number>();
  for (const i of list) byCat.set(i.category, (byCat.get(i.category) ?? 0) + 1);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const subs = new Map<string, number>();
  for (const i of list.filter((x) => x.category === cats[0]?.[0]))
    subs.set(i.ai.subcategory, (subs.get(i.ai.subcategory) ?? 0) + 1);
  const topSub = [...subs.entries()].sort((a, b) => b[1] - a[1])[0];
  const locAssets = assets.filter((a) => a.locationId === locationId);
  const atRisk = locAssets.filter((a) => a.risk >= 70);
  const downtime = list.reduce((s, i) => s + i.downtimeMinutes, 0);
  const riskLevel = loc.healthScore < 55 ? "High" : loc.healthScore < 78 ? "Moderate" : "Low";
  return {
    location: loc,
    incidents: list,
    total: list.length,
    open: list.filter((i) => i.status !== "Resolved").length,
    categories: cats.map(([category, count]) => ({ category, count, share: Math.round((count / list.length) * 100) })),
    topSubcategory: topSub?.[0],
    assets: locAssets,
    atRisk,
    downtimeMinutes: downtime,
    downtimeRisk: riskLevel,
  };
}

export function getInsights() {
  const top = getTopLocations(30, 3);
  const insights: { tone: "crit" | "warn" | "info"; title: string; body: string; locationId?: string }[] = [];
  for (const { location } of top.slice(0, 2)) {
    const p = getLocationProfile(location.id);
    const lead = p.categories[0];
    if (!lead) continue;
    insights.push({
      tone: location.health === "critical" ? "crit" : "warn",
      title: `${location.name}: recurring ${lead.category.toLowerCase()} issues`,
      body: `${lead.share}% of ${p.total} incidents in 30 days relate to ${lead.category.toLowerCase()}, mostly ${p.topSubcategory?.toLowerCase()}.`,
      locationId: location.id,
    });
  }
  const risky = getAssetsAtRisk(1)[0];
  if (risky) {
    insights.push({
      tone: "info",
      title: `${risky.tag} likely to fail within 30 days`,
      body: `Predicted failure probability ${risky.risk}%. ${risky.failureCount} past failures, last serviced ${risky.daysSinceMaintenance} days ago.`,
      locationId: risky.locationId,
    });
  }
  return insights;
}

export function getAiAccuracy() {
  const reviewed = incidents.filter((i) => i.ai.review !== "Pending");
  const approved = reviewed.filter((i) => i.ai.review === "Approved").length;
  const modified = reviewed.filter((i) => i.ai.review === "Modified").length;
  const rejected = reviewed.filter((i) => i.ai.review === "Rejected").length;
  return {
    reviewed: reviewed.length,
    approved,
    modified,
    rejected,
    acceptance: Math.round((approved / Math.max(1, reviewed.length)) * 100),
  };
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function timeAgo(ts: number) {
  const m = Math.round((NOW - ts) / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
