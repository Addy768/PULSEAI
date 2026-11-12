import type { Asset, Category, Health, Incident, IncidentStatus, Location, Priority, Team } from "./types";

// Fixed reference time keeps server and client renders identical.
export const NOW = Date.UTC(2026, 10, 12, 15, 0, 0);
const DAY = 86_400_000;
const MIN = 60_000;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(104);
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));

const CITIES: [string, string][] = [
  ["Mississauga", "GTA West"],
  ["Brampton", "GTA West"],
  ["Oakville", "GTA West"],
  ["Milton", "GTA West"],
  ["Toronto", "Central"],
  ["North York", "Central"],
  ["Etobicoke", "Central"],
  ["Markham", "GTA East"],
  ["Scarborough", "GTA East"],
  ["Pickering", "GTA East"],
  ["Vaughan", "GTA North"],
  ["Richmond Hill", "GTA North"],
  ["Hamilton", "Southwest"],
  ["Burlington", "Southwest"],
  ["Kitchener", "Southwest"],
  ["Guelph", "Southwest"],
];

const STORE_NUMBERS = [
  12, 18, 23, 31, 37, 42, 48, 55, 61, 66, 72, 79, 87, 93, 98, 104, 110, 117, 123, 129, 134, 140, 146, 152, 158,
  163, 171, 176, 182, 188, 193, 199, 204, 210, 215, 221, 228, 233, 239, 244, 250, 256, 262, 268, 273, 279, 284,
  290, 296, 301,
];

// Locations with a known story in the demo dataset.
const HOTSPOTS: Record<number, { weight: number; category: Category }> = {
  104: { weight: 9, category: "Network" },
  221: { weight: 7, category: "POS" },
  87: { weight: 5, category: "Hardware" },
  163: { weight: 3, category: "Network" },
};
const OFFLINE = new Set([204, 279, 104]);

function layout(i: number, total: number): [number, number, number] {
  // Fibonacci sphere gives an even, organic spread of nodes.
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (total - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i;
  const radius = 3.2;
  return [Math.cos(theta) * r * radius, y * radius * 0.82, Math.sin(theta) * r * radius];
}

export const locations: Location[] = STORE_NUMBERS.map((n, i) => {
  const [city, region] = CITIES[i % CITIES.length];
  return {
    id: `LOC-${n}`,
    code: `STORE-${n}`,
    name: `Store ${n}`,
    city,
    region,
    online: !OFFLINE.has(n),
    health: "healthy",
    healthScore: 100,
    position: layout(i, STORE_NUMBERS.length),
    dependsOn: [],
  };
});

// Each store depends on a regional hub (first store in its region).
const hubs = new Map<string, string>();
for (const loc of locations) {
  if (!hubs.has(loc.region)) hubs.set(loc.region, loc.id);
  else loc.dependsOn.push(hubs.get(loc.region)!);
}
const hubIds = [...hubs.values()];
hubIds.forEach((id, i) => {
  const loc = locations.find((l) => l.id === id)!;
  loc.dependsOn.push(hubIds[(i + 1) % hubIds.length]);
});

const ASSET_TYPES = [
  { type: "Router", prefix: "RTR", category: "Network" as Category },
  { type: "Access Point", prefix: "AP", category: "Network" as Category },
  { type: "POS Terminal", prefix: "POS", category: "POS" as Category },
  { type: "Receipt Printer", prefix: "PRN", category: "Hardware" as Category },
  { type: "Back Office PC", prefix: "PC", category: "Hardware" as Category },
  { type: "HVAC Unit", prefix: "HVAC", category: "Facilities" as Category },
  { type: "Walk-in Cooler", prefix: "COOL", category: "Facilities" as Category },
];

export const assets: Asset[] = [];
for (const loc of locations) {
  const n = Number(loc.code.split("-")[1]);
  for (const t of ASSET_TYPES) {
    const count = t.type === "POS Terminal" ? 2 : 1;
    for (let k = 1; k <= count; k++) {
      assets.push({
        id: `${t.prefix}-${n}-${String(k).padStart(2, "0")}`,
        tag: `${t.prefix}-${n}-${String(k).padStart(2, "0")}`,
        type: t.type,
        locationId: loc.id,
        ageMonths: between(4, 84),
        failureCount: 0,
        downtimeHours: 0,
        daysSinceMaintenance: between(10, 420),
        risk: 0,
      });
    }
  }
}

const TEMPLATES: Record<
  Category,
  { title: string; description: string; sub: string; system: string; asset: string; action: string; team: Team }[]
> = {
  Network: [
    {
      title: "POS terminals disconnecting every few minutes",
      description: "Our POS terminals keep disconnecting every few minutes and the Wi-Fi seems unstable.",
      sub: "Wireless connectivity",
      system: "POS",
      asset: "Access Point",
      action: "Check access point connectivity and DHCP lease behaviour; review AP firmware version.",
      team: "Infrastructure",
    },
    {
      title: "Store internet down, card payments failing",
      description: "Lost internet connection at opening. Card payments are failing, only cash accepted.",
      sub: "WAN outage",
      system: "Payments",
      asset: "Router",
      action: "Verify ISP circuit status, power-cycle edge router, fail over to LTE backup.",
      team: "Infrastructure",
    },
    {
      title: "Slow network in back office",
      description: "Inventory system takes over a minute to load pages from the back office PC.",
      sub: "Latency",
      system: "Inventory",
      asset: "Router",
      action: "Run bandwidth test, check for saturated uplink and QoS policy.",
      team: "Infrastructure",
    },
  ],
  POS: [
    {
      title: "POS frozen on payment screen",
      description: "Lane 2 POS freezes on the payment screen and needs a restart after every few transactions.",
      sub: "Application hang",
      system: "POS",
      asset: "POS Terminal",
      action: "Clear POS application cache and apply latest POS client patch.",
      team: "Service Desk",
    },
    {
      title: "PIN pad not pairing with terminal",
      description: "PIN pad shows 'device not found' and customers cannot tap to pay.",
      sub: "Peripheral pairing",
      system: "Payments",
      asset: "POS Terminal",
      action: "Re-pair PIN pad, confirm USB/Bluetooth driver, swap cable if needed.",
      team: "Field Tech",
    },
  ],
  Hardware: [
    {
      title: "Receipt printer jamming",
      description: "Receipt printer jams on almost every receipt, paper is loaded correctly.",
      sub: "Printer fault",
      system: "POS",
      asset: "Receipt Printer",
      action: "Inspect print head and cutter; replace printer if failure count exceeds threshold.",
      team: "Field Tech",
    },
    {
      title: "Back office PC will not boot",
      description: "Manager PC shows a black screen after the logo. Cannot access scheduling.",
      sub: "Boot failure",
      system: "Workstation",
      asset: "Back Office PC",
      action: "Run hardware diagnostics; re-image from golden image if disk is healthy.",
      team: "Field Tech",
    },
  ],
  Accounts: [
    {
      title: "Employee locked out of POS",
      description: "New shift lead cannot log into POS, says account is locked.",
      sub: "Account lockout",
      system: "Identity",
      asset: "POS Terminal",
      action: "Unlock account in directory and confirm role assignment for the location.",
      team: "Identity",
    },
    {
      title: "Password reset for scheduling app",
      description: "Need a password reset for the scheduling app, reset email never arrived.",
      sub: "Password reset",
      system: "Identity",
      asset: "Back Office PC",
      action: "Trigger self-service reset and verify email address on the employee record.",
      team: "Identity",
    },
  ],
  Facilities: [
    {
      title: "Walk-in cooler temperature rising",
      description: "Walk-in cooler reading 7C and climbing. Product at risk.",
      sub: "Refrigeration",
      system: "Cold chain",
      asset: "Walk-in Cooler",
      action: "Dispatch refrigeration vendor; move perishables to backup cooler.",
      team: "Facilities",
    },
    {
      title: "HVAC not cooling sales floor",
      description: "Sales floor is very warm, HVAC is running but blowing warm air.",
      sub: "HVAC",
      system: "Building",
      asset: "HVAC Unit",
      action: "Check filters and refrigerant pressure; schedule HVAC vendor visit.",
      team: "Facilities",
    },
  ],
};

const CATEGORY_WEIGHTS: [Category, number][] = [
  ["Network", 34],
  ["POS", 22],
  ["Hardware", 17],
  ["Accounts", 12],
  ["Facilities", 15],
];

function weightedCategory(): Category {
  const r = rand() * 100;
  let acc = 0;
  for (const [c, w] of CATEGORY_WEIGHTS) {
    acc += w;
    if (r < acc) return c;
  }
  return "Network";
}

const SLA_MINUTES: Record<Priority, number> = { Critical: 60, High: 240, Medium: 480, Low: 1440 };

function priorityFor(category: Category, system: string): Priority {
  if (system === "Payments" || system === "Cold chain") return rand() > 0.35 ? "Critical" : "High";
  if (category === "Network" || category === "POS") return rand() > 0.4 ? "High" : "Medium";
  if (category === "Accounts") return rand() > 0.7 ? "Medium" : "Low";
  return pick(["High", "Medium", "Medium", "Low"] as Priority[]);
}

export const incidents: Incident[] = [];
let seq = 10_240;

function createIncident(loc: Location, category: Category, createdAt: number) {
  const t = pick(TEMPLATES[category]);
  const locAssets = assets.filter((a) => a.locationId === loc.id && a.type === t.asset);
  const asset = locAssets.length ? pick(locAssets) : undefined;
  const priority = priorityFor(category, t.system);
  const age = NOW - createdAt;
  const mttr = Math.round(SLA_MINUTES[priority] * (0.1 + rand() ** 2.4 * 0.94));
  const resolved = age > mttr * MIN * 1.4 && rand() > 0.06;
  const resolvedAt = resolved ? createdAt + mttr * MIN : undefined;
  const slaDueAt = createdAt + SLA_MINUTES[priority] * MIN;
  const slaBreached = resolved ? resolvedAt! > slaDueAt : NOW > slaDueAt;
  let status: IncidentStatus = "Resolved";
  if (!resolved) status = slaBreached ? "Escalated" : pick(["New", "Triaged", "In Progress"] as IncidentStatus[]);

  if (asset) {
    asset.failureCount += 1;
    asset.downtimeHours += Math.round((Math.min(mttr, 240) / 60) * 10) / 10;
  }

  incidents.push({
    id: `INC-${seq++}`,
    title: t.title,
    description: t.description,
    locationId: loc.id,
    assetId: asset?.id,
    category,
    priority,
    status,
    team: t.team,
    source: category === "Network" && rand() > 0.6 ? "Monitoring" : pick(["Manual", "Manual", "Email"] as const),
    createdAt,
    resolvedAt,
    slaDueAt,
    slaBreached,
    downtimeMinutes: t.system === "Payments" || t.system === "POS" ? Math.min(mttr, 240) : Math.min(Math.round(mttr * 0.3), 120),
    recurring: false,
    ai: {
      suggestedPriority: priority,
      suggestedCategory: category,
      subcategory: t.sub,
      affectedSystem: t.system,
      confidence: Math.round(72 + rand() * 26),
      reasoning: "",
      evidence: [],
      action: t.action,
      team: t.team,
      review: resolved ? pick(["Approved", "Approved", "Approved", "Modified", "Rejected"] as const) : "Pending",
    },
  });
}

// Baseline volume across all stores over 90 days.
for (let i = 0; i < 420; i++) {
  const loc = pick(locations);
  createIncident(loc, weightedCategory(), NOW - Math.floor(rand() ** 1.3 * 90 * DAY));
}
// Hotspot stories.
for (const [num, spot] of Object.entries(HOTSPOTS)) {
  const loc = locations.find((l) => l.code === `STORE-${num}`)!;
  for (let i = 0; i < spot.weight * 2; i++) {
    const category = rand() > 0.3 ? spot.category : weightedCategory();
    createIncident(loc, category, NOW - Math.floor(rand() * 30 * DAY));
  }
}
// A live critical for the demo narrative.
{
  const loc = locations.find((l) => l.code === "STORE-104")!;
  createIncident(loc, "Network", NOW - 22 * MIN);
  const live = incidents[incidents.length - 1];
  const t = TEMPLATES.Network[0];
  Object.assign(live, {
    title: t.title,
    description: t.description,
    priority: "High",
    status: "Triaged",
    resolvedAt: undefined,
    slaBreached: false,
    slaDueAt: live.createdAt + SLA_MINUTES.High * MIN,
  });
  Object.assign(live.ai, {
    suggestedPriority: "High",
    subcategory: t.sub,
    affectedSystem: "POS",
    action: t.action,
    team: "Infrastructure",
    review: "Pending",
    confidence: 91,
  });
}
incidents.sort((a, b) => b.createdAt - a.createdAt);

// Recurrence detection + explainable AI evidence.
for (const inc of incidents) {
  const similar = incidents.filter(
    (o) =>
      o !== inc &&
      o.locationId === inc.locationId &&
      o.category === inc.category &&
      o.createdAt < inc.createdAt &&
      inc.createdAt - o.createdAt <= 30 * DAY,
  );
  inc.recurring = similar.length >= 3;
  const loc = locations.find((l) => l.id === inc.locationId)!;
  const evidence = [`${similar.length} similar ${inc.category.toLowerCase()} incidents at ${loc.name} in the past 30 days`];
  if (inc.assetId) {
    const asset = assets.find((a) => a.id === inc.assetId)!;
    evidence.push(`${asset.tag} has ${asset.failureCount} logged failures`);
  }
  if (inc.ai.affectedSystem === "Payments" || inc.ai.affectedSystem === "POS")
    evidence.push("Revenue-impacting system at an active business location");
  inc.ai.evidence = evidence;
  inc.ai.reasoning =
    inc.priority === "Critical" || inc.priority === "High"
      ? `${inc.ai.affectedSystem} unavailable or degraded at active business location.`
      : `Limited operational impact; ${inc.ai.subcategory.toLowerCase()} with known fix.`;
}

// Asset risk scoring (Phase 3 swaps this heuristic for an XGBoost model).
for (const a of assets) {
  const z =
    -5.7 + a.ageMonths * 0.025 + a.failureCount * 0.55 + a.daysSinceMaintenance * 0.004 + a.downtimeHours * 0.08;
  a.risk = Math.round((1 / (1 + Math.exp(-z))) * 100);
}

// Location health from open incidents, SLA breaches and asset risk.
for (const loc of locations) {
  const open = incidents.filter((i) => i.locationId === loc.id && i.status !== "Resolved");
  const recent = incidents.filter((i) => i.locationId === loc.id && NOW - i.createdAt < 30 * DAY);
  const risky = assets.filter((a) => a.locationId === loc.id && a.risk >= 70).length;
  const critical = open.some((i) => i.priority === "Critical") || !loc.online;
  const score = Math.max(
    18,
    100 - open.length * 9 - recent.length * 1.6 - risky * 6 - (loc.online ? 0 : 20) - (critical ? 10 : 0),
  );
  loc.healthScore = Math.round(score);
  loc.health = (critical || score < 55 ? "critical" : score < 78 ? "warning" : "healthy") as Health;
}

export const maintenanceTasks = [] as import("./types").MaintenanceTask[];

export const byId = {
  location: (id: string) => locations.find((l) => l.id === id)!,
  asset: (id?: string) => (id ? assets.find((a) => a.id === id) : undefined),
};
