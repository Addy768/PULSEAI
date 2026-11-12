# Roadmap

Pulse AI is built in phases. Each phase ships something usable on its own.

## Phase 1: Foundation (done)

- Monorepo: `web/` (Next.js command center) and `salesforce/` (SFDX project)
- Landing page with an interactive Three.js operations network (click a node to inspect a location)
- Command center: KPIs, incident trend, categories, assets at risk, AI insights, incident queue with explainable AI triage and approve/modify/reject review, asset health, locations, RBAC matrix, AI acceptance metrics
- Copilot with tool-call trace (`query_incidents`, `summarize_location`, `list_assets_at_risk`, `get_sla_status`, `create_maintenance_task`), deterministic intent routing over the same tools the LLM agent will use
- Salesforce data model: `Location__c`, `Ops_Asset__c`, `Incident__c`, `Maintenance_Task__c`, `Incident_Pattern__c`, `AI_Recommendation__c`, `SLA_Policy__mdt`, `Device_Alert__e`
- Apex: rule-based classifier behind `IIncidentClassifier`, bulk-safe triage (SLA, recurrence, duplicate detection, recommendations, pattern upserts), SLA escalation batch + schedule, Platform Event handler (create on outage, auto-resolve on recovery), command center + review controllers, unit tests
- LWC: `pulseCommandCenter` (app page/tab) and `aiRecommendationReview` (Incident record page)
- Permission sets: Store Employee, Technician, Manager, Administrator
- Lightning app `Pulse AI` with tabs and a Command Center app page

## Phase 2: Org deploy + Flow + AI service

- Deploy to a Developer Edition org, run Apex tests, capture coverage
- Record-triggered Flows: high-priority routing + manager alert, SLA escalation notification, escalation record
- `ai-service/` (FastAPI): classification with an LLM (Gemini free tier), embeddings + similarity search over historical incidents, location summaries
- `RemoteIncidentClassifier` via Named Credential + Queueable callout, rule-based fallback
- Copilot backed by LLM function calling against Salesforce REST

## Phase 3: Predictive maintenance + events

- Synthetic asset history generator, XGBoost failure model, scores written to `Risk_Score__c`
- Preventive `Maintenance_Task__c` auto-created above threshold (Origin = Predictive Model)
- Monitoring simulator publishing `Device_Alert__e` via REST
- Location-based sharing rules (public group per region/location)

## Phase 4: Business impact + FinOps + evaluation

- Downtime, lost productivity, cost per incident and per location
- FinOps view: AI API, AWS and Salesforce API spend, cost per resolved incident
- AI evaluation report: acceptance, modification and rejection rates by category and model version
- Web app reads live data from Salesforce (with demo-mode fallback); deploy to Vercel
