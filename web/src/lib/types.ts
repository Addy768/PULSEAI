export type Priority = "Critical" | "High" | "Medium" | "Low";
export type IncidentStatus = "New" | "Triaged" | "In Progress" | "Escalated" | "Resolved";
export type Category = "Network" | "POS" | "Hardware" | "Accounts" | "Facilities";
export type Health = "healthy" | "warning" | "critical";
export type ReviewStatus = "Pending" | "Approved" | "Modified" | "Rejected";
export type Team = "Infrastructure" | "Service Desk" | "Field Tech" | "Facilities" | "Identity";

export interface Location {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
  online: boolean;
  health: Health;
  healthScore: number;
  position: [number, number, number];
  dependsOn: string[];
}

export interface Asset {
  id: string;
  tag: string;
  type: string;
  locationId: string;
  ageMonths: number;
  failureCount: number;
  downtimeHours: number;
  daysSinceMaintenance: number;
  risk: number;
}

export interface AiRecommendation {
  suggestedPriority: Priority;
  suggestedCategory: Category;
  subcategory: string;
  affectedSystem: string;
  confidence: number;
  reasoning: string;
  evidence: string[];
  action: string;
  team: Team;
  review: ReviewStatus;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  locationId: string;
  assetId?: string;
  category: Category;
  priority: Priority;
  status: IncidentStatus;
  team: Team;
  source: "Manual" | "Monitoring" | "Email";
  createdAt: number;
  resolvedAt?: number;
  slaDueAt: number;
  slaBreached: boolean;
  downtimeMinutes: number;
  recurring: boolean;
  ai: AiRecommendation;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  locationId: string;
  assetId?: string;
  team: Team;
  type: "Preventive" | "Corrective";
  dueAt: number;
  createdBy: "Copilot" | "Flow" | "User";
}
