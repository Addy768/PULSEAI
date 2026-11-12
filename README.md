# Pulse AI

**AI operations command center for multi-location businesses, built on Salesforce.**

Stores, clinics, warehouses and restaurants deal with incidents, equipment failures and maintenance scattered across email, spreadsheets and chat. Pulse AI brings them into one Salesforce application, then uses AI to triage problems, detect recurring failures, recommend fixes and predict maintenance before downtime hits.

```
"Our POS terminals keep disconnecting every few minutes and the Wi-Fi seems unstable."

Category      Network            Similar (30d)   3 incidents at Store 104
Subcategory   Wireless           Pattern         Possible recurring infrastructure issue
Priority      High               Action          Check AP connectivity and DHCP lease behaviour
System        POS                Routed to       Infrastructure, SLA clock started
```

## What's in the repo

| Path | What |
| --- | --- |
| `web/` | Next.js 14 + TypeScript + Tailwind. Landing page with a Three.js operations network, plus the command center (overview, incidents, assets, copilot, locations, admin) |
| `salesforce/` | SFDX project: custom objects, Apex services and tests, triggers, Platform Event, LWCs, permission sets, Lightning app |
| `docs/` | [Architecture](docs/ARCHITECTURE.md) and [Roadmap](docs/ROADMAP.md) |

## Highlights

- **AI incident intelligence:** classification, recurrence detection, duplicate detection and recommendations with reasoning, evidence and confidence
- **Human in the loop:** approve, modify or reject every AI recommendation; outcomes are stored for accuracy evaluation
- **Event-driven:** monitoring publishes `Device_Alert__e`; Salesforce opens incidents on outage and auto-resolves on recovery
- **SLA enforcement:** targets in Custom Metadata, hourly escalation batch
- **Operations copilot:** answers questions and takes actions through tools, with a visible tool-call trace
- **Role-based access:** Store Employee, Technician, Manager and Administrator permission sets on a Private sharing model
- **3D operations network:** every node is a location; color is health, size is incident volume, lines are shared infrastructure

## Run the web app

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

The web app currently runs on a deterministic demo dataset (50 locations, ~400 assets, ~500 incidents). Phase 4 connects it to live Salesforce data.

## Deploy the Salesforce app

Requires the [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) and a free [Developer Edition org](https://developer.salesforce.com/signup).

```bash
cd salesforce
sf org login web --alias pulse --set-default
sf project deploy start --source-dir force-app --test-level RunLocalTests
sf org assign permset --name Pulse_Administrator
sf apex run --file scripts/apex/seed.apex
sf apex run --file scripts/apex/schedule-jobs.apex
sf org open --path lightning/app/c__Pulse_AI
```

Simulate a monitoring outage:

```bash
sf apex run --file scripts/apex/publish-device-alert.apex
```

Add the **AI Recommendation Review** component to the Incident record page in Lightning App Builder.

## Stack

Salesforce (Apex, SOQL, LWC, Flow, Platform Events, Custom Metadata, Permission Sets) · Next.js · TypeScript · Tailwind CSS · Three.js / React Three Fiber · Recharts · FastAPI and Python (Phase 2) · XGBoost (Phase 3)

## Status

Phase 1 complete. See the [roadmap](docs/ROADMAP.md).
