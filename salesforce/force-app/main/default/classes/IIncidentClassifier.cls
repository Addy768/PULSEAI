/**
 * Strategy interface so triage can swap the rule-based classifier for the
 * FastAPI/LLM classifier without touching trigger logic.
 */
public interface IIncidentClassifier {
    IncidentClassification classify(String subject, String description);
}
