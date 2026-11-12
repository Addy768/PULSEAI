/**
 * Result of classifying a free-text incident report.
 * Shared by the rule-based classifier (Phase 1) and the remote AI service (Phase 2).
 */
public with sharing class IncidentClassification {
    public String category;
    public String subcategory;
    public String affectedSystem;
    public String priority;
    public String team;
    public String recommendedAction;
    public String reasoning;
    public Decimal confidence;
    public String modelVersion;

    public Boolean isClassified() {
        return String.isNotBlank(category) && category != 'Other';
    }
}
