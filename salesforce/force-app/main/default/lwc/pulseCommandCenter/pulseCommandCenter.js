import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { NavigationMixin } from "lightning/navigation";
import getOverview from "@salesforce/apex/CommandCenterController.getOverview";

const PRIORITY_CLASS = {
    Critical: "pill pill_crit",
    High: "pill pill_warn",
    Medium: "pill pill_info",
    Low: "pill"
};

export default class PulseCommandCenter extends NavigationMixin(LightningElement) {
    overview;
    error;
    wiredResult;

    @wire(getOverview)
    wired(result) {
        this.wiredResult = result;
        if (result.data) {
            this.overview = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error?.body?.message ?? "Unknown error";
        }
    }

    get loading() {
        return !this.overview && !this.error;
    }

    get kpis() {
        const k = this.overview?.kpis ?? {};
        return [
            { key: "online", label: "Locations online", value: `${k.locationsOnline ?? 0} / ${k.locationsTotal ?? 0}`, tone: "kpi kpi_ok" },
            { key: "critical", label: "Critical incidents", value: k.criticalIncidents ?? 0, tone: "kpi kpi_crit" },
            { key: "mttr", label: "Avg MTTR", value: this.formatMinutes(k.mttrMinutes ?? 0), tone: "kpi" },
            { key: "sla", label: "SLA compliance", value: `${k.slaCompliance ?? 100}%`, tone: k.slaCompliance >= 95 ? "kpi kpi_ok" : "kpi kpi_warn" },
            { key: "recurring", label: "Recurring problems", value: k.recurringProblems ?? 0, tone: "kpi kpi_warn" },
            { key: "risk", label: "Assets at risk", value: k.assetsAtRisk ?? 0, tone: "kpi kpi_warn" }
        ];
    }

    get categories() {
        return (this.overview?.categories ?? []).map((c) => ({ ...c, style: `width:${c.share}%` }));
    }

    get topLocations() {
        return (this.overview?.topLocations ?? []).map((l, i) => ({ ...l, rank: i + 1 }));
    }

    get assets() {
        return (this.overview?.assetsAtRisk ?? []).map((a) => {
            const risk = Math.round(a.Risk_Score__c ?? 0);
            const color = risk >= 70 ? "#c23934" : risk >= 45 ? "#dd7a01" : "#2e844a";
            return {
                id: a.Id,
                name: a.Name,
                meta: `${a.Asset_Type__c ?? "Asset"} · ${a.Location__r?.Name ?? ""}`,
                risk,
                barStyle: `width:${risk}%;background:${color}`
            };
        });
    }

    get incidents() {
        return (this.overview?.openIncidents ?? []).map((i) => ({
            id: i.Id,
            number: i.Name,
            subject: i.Subject__c,
            location: i.Location__r?.Name,
            priority: i.Priority__c,
            priorityClass: PRIORITY_CLASS[i.Priority__c] ?? "pill",
            status: i.Status__c,
            team: i.Assigned_Team__c,
            recurring: i.Is_Recurring__c
        }));
    }

    get hasIncidents() {
        return this.incidents.length > 0;
    }

    formatMinutes(m) {
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
    }

    handleRefresh() {
        return refreshApex(this.wiredResult);
    }

    openRecord(event) {
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: { recordId: event.currentTarget.dataset.id, actionName: "view" }
        });
    }
}
