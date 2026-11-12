# Architecture

```
                 +-------------------------+
 Store report -> |  Incident__c (insert)   | <- Device_Alert__e <- Monitoring
                 +------------+------------+
                              |
                  IncidentTrigger -> IncidentTriggerHandler
                              |
                  IncidentTriageService (bulk-safe)
                   - IIncidentClassifier (rules now, FastAPI/LLM in Phase 2)
                   - SlaService (SLA_Policy__mdt)
                   - recurrence (aggregate SOQL, 30 day window)
                   - duplicate detection (asset/device, 4 hour window)
                              |
          +-------------------+--------------------+
          |                                        |
 AI_Recommendation__c                     Incident_Pattern__c
 (reason, evidence, confidence,           (upsert on Pattern_Key__c)
  human review)
          |
 aiRecommendationReview LWC     pulseCommandCenter LWC <- CommandCenterController
                                                          (WITH USER_MODE)

 SlaEscalationJob (Schedulable + Batchable, hourly) -> Escalated / SLA_Breached__c
```

## Responsibilities

| Layer | Owns |
| --- | --- |
| Salesforce | Records, workflow, permissions, approvals, SLA enforcement, audit trail |
| AI service (Phase 2) | Classification, embeddings, similarity, anomaly detection, summaries |
| Web command center | Landing experience, 3D network, analytics UI, copilot UI |

## Design decisions

- **Classifier behind an interface.** Triggers cannot make synchronous callouts, so Phase 2 runs the remote classifier in a Queueable and keeps the rule-based classifier as an instant first pass and fallback.
- **SLA targets in Custom Metadata.** Deployable, testable and editable without code.
- **Explainability first.** Every recommendation stores reasoning, evidence, confidence and model version, and human review outcomes are kept for accuracy evaluation.
- **Security.** `Incident__c` is Private OWD; access is granted through permission sets. Controllers query `WITH USER_MODE`. The platform event handler runs `without sharing` because it executes as the Automated Process user.
