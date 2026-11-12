import { LightningElement, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getLatest from "@salesforce/apex/AiRecommendationController.getLatest";
import review from "@salesforce/apex/AiRecommendationController.review";

export default class AiRecommendationReview extends LightningElement {
    @api recordId;
    rec;
    wiredResult;
    notes = "";
    saving = false;

    @wire(getLatest, { incidentId: "$recordId" })
    wired(result) {
        this.wiredResult = result;
        this.rec = result.data;
    }

    get evidence() {
        return (this.rec?.Evidence__c ?? "").split("\n").filter(Boolean).map((text, i) => ({ key: i, text }));
    }

    get confidence() {
        return Math.round(this.rec?.Confidence__c ?? 0);
    }

    get confidenceStyle() {
        return `width:${this.confidence}%`;
    }

    get isPending() {
        return this.rec?.Review_Status__c === "Pending";
    }

    handleNotes(event) {
        this.notes = event.target.value;
    }

    async decide(event) {
        this.saving = true;
        try {
            await review({ recommendationId: this.rec.Id, decision: event.target.dataset.decision, notes: this.notes });
            this.dispatchEvent(new ShowToastEvent({ title: "Review saved", message: `Recommendation ${event.target.dataset.decision.toLowerCase()}.`, variant: "success" }));
            await refreshApex(this.wiredResult);
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({ title: "Could not save review", message: e?.body?.message ?? "Unknown error", variant: "error" }));
        } finally {
            this.saving = false;
        }
    }
}
