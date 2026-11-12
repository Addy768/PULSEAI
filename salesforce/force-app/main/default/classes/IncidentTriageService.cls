/**
 * Bulk-safe incident triage: AI classification, SLA assignment, duplicate
 * detection, recurrence detection and explainable recommendations.
 */
public inherited sharing class IncidentTriageService {
    public static final Integer RECURRENCE_WINDOW_DAYS = 30;
    public static final Integer RECURRENCE_THRESHOLD = 3;
    public static final Integer DUPLICATE_WINDOW_HOURS = 4;

    @TestVisible
    private static IIncidentClassifier classifier = new RuleBasedIncidentClassifier();

    private static final Set<String> CLOSED_STATUSES = new Set<String>{ 'Resolved', 'Closed' };

    /** before insert: enrich records in place. */
    public static void triage(List<Incident__c> incidents) {
        for (Incident__c inc : incidents) {
            IncidentClassification c = classifier.classify(inc.Subject__c, inc.Description__c);
            if (String.isBlank(inc.Category__c)) {
                inc.Category__c = c.category;
            }
            if (String.isBlank(inc.Subcategory__c)) {
                inc.Subcategory__c = c.subcategory;
            }
            if (String.isBlank(inc.Affected_System__c)) {
                inc.Affected_System__c = c.affectedSystem;
            }
            if (String.isBlank(inc.Priority__c)) {
                inc.Priority__c = c.priority;
            }
            if (String.isBlank(inc.Assigned_Team__c)) {
                inc.Assigned_Team__c = c.team;
            }
            inc.AI_Confidence__c = c.confidence;
            if ((inc.Status__c == null || inc.Status__c == 'New') && c.isClassified()) {
                inc.Status__c = 'Triaged';
            }
            inc.SLA_Due__c = SlaService.dueDate(inc.Priority__c, Datetime.now());
        }
        flagRecurrence(incidents);
        flagDuplicates(incidents);
    }

    /** after insert: persist recommendations and recurring patterns. */
    public static void afterInsert(List<Incident__c> incidents) {
        createRecommendations(incidents);
        upsertPatterns(incidents);
    }

    /** before update: lifecycle timestamps and SLA recalculation. */
    public static void beforeUpdate(List<Incident__c> incidents, Map<Id, Incident__c> oldMap) {
        for (Incident__c inc : incidents) {
            Incident__c old = oldMap.get(inc.Id);
            if (CLOSED_STATUSES.contains(inc.Status__c) && !CLOSED_STATUSES.contains(old.Status__c)) {
                inc.Resolved_At__c = Datetime.now();
            } else if (!CLOSED_STATUSES.contains(inc.Status__c) && CLOSED_STATUSES.contains(old.Status__c)) {
                inc.Resolved_At__c = null;
            }
            if (inc.Priority__c != old.Priority__c && !CLOSED_STATUSES.contains(inc.Status__c)) {
                inc.SLA_Due__c = SlaService.dueDate(inc.Priority__c, inc.CreatedDate);
                inc.SLA_Breached__c = inc.SLA_Due__c < Datetime.now();
            }
        }
    }

    private static String key(Id locationId, String category) {
        return String.valueOf(locationId) + ':' + category;
    }

    private static Map<String, Integer> recentCounts(Set<Id> locationIds) {
        Map<String, Integer> counts = new Map<String, Integer>();
        Datetime since = Datetime.now().addDays(-RECURRENCE_WINDOW_DAYS);
        for (AggregateResult ar : [
            SELECT Location__c loc, Category__c cat, COUNT(Id) total
            FROM Incident__c
            WHERE Location__c IN :locationIds AND CreatedDate >= :since AND Category__c != NULL
            GROUP BY Location__c, Category__c
        ]) {
            counts.put(key((Id) ar.get('loc'), (String) ar.get('cat')), (Integer) ar.get('total'));
        }
        return counts;
    }

    private static Set<Id> locationIds(List<Incident__c> incidents) {
        Set<Id> ids = new Set<Id>();
        for (Incident__c inc : incidents) {
            if (inc.Location__c != null) {
                ids.add(inc.Location__c);
            }
        }
        return ids;
    }

    private static void flagRecurrence(List<Incident__c> incidents) {
        Map<String, Integer> counts = recentCounts(locationIds(incidents));
        // Incidents in the same batch count toward each other.
        Map<String, Integer> batch = new Map<String, Integer>();
        for (Incident__c inc : incidents) {
            String k = key(inc.Location__c, inc.Category__c);
            Integer prior = (counts.containsKey(k) ? counts.get(k) : 0) + (batch.containsKey(k) ? batch.get(k) : 0);
            inc.Related_Incident_Count__c = prior;
            inc.Is_Recurring__c = prior >= RECURRENCE_THRESHOLD;
            batch.put(k, (batch.containsKey(k) ? batch.get(k) : 0) + 1);
        }
    }

    private static void flagDuplicates(List<Incident__c> incidents) {
        Set<Id> assetIds = new Set<Id>();
        Set<String> deviceIds = new Set<String>();
        for (Incident__c inc : incidents) {
            if (inc.Asset__c != null) {
                assetIds.add(inc.Asset__c);
            }
            if (String.isNotBlank(inc.Device_Id__c)) {
                deviceIds.add(inc.Device_Id__c);
            }
        }
        if (assetIds.isEmpty() && deviceIds.isEmpty()) {
            return;
        }
        Datetime since = Datetime.now().addHours(-DUPLICATE_WINDOW_HOURS);
        Map<String, Id> openBySignature = new Map<String, Id>();
        for (Incident__c open : [
            SELECT Id, Asset__c, Device_Id__c, Category__c
            FROM Incident__c
            WHERE (Asset__c IN :assetIds OR Device_Id__c IN :deviceIds)
                AND Status__c NOT IN :CLOSED_STATUSES
                AND Duplicate_Of__c = NULL
                AND CreatedDate >= :since
            ORDER BY CreatedDate ASC
        ]) {
            String sig = signature(open);
            if (!openBySignature.containsKey(sig)) {
                openBySignature.put(sig, open.Id);
            }
        }
        for (Incident__c inc : incidents) {
            Id parent = openBySignature.get(signature(inc));
            if (parent != null) {
                inc.Duplicate_Of__c = parent;
            }
        }
    }

    private static String signature(Incident__c inc) {
        String target = inc.Asset__c != null ? String.valueOf(inc.Asset__c) : inc.Device_Id__c;
        return target + ':' + inc.Category__c;
    }

    private static void createRecommendations(List<Incident__c> incidents) {
        List<AI_Recommendation__c> recs = new List<AI_Recommendation__c>();
        for (Incident__c inc : incidents) {
            IncidentClassification c = classifier.classify(inc.Subject__c, inc.Description__c);
            List<String> evidence = new List<String>{
                inc.Related_Incident_Count__c.intValue() + ' similar ' + String.valueOf(inc.Category__c).toLowerCase() +
                ' incidents at this location in the past ' + RECURRENCE_WINDOW_DAYS + ' days'
            };
            if (inc.Is_Recurring__c) {
                evidence.add('Pattern threshold reached: possible recurring infrastructure issue');
            }
            if (inc.Duplicate_Of__c != null) {
                evidence.add('Open incident already exists for the same asset or device');
            }
            recs.add(new AI_Recommendation__c(
                Incident__c = inc.Id,
                Suggested_Category__c = c.category,
                Suggested_Subcategory__c = c.subcategory,
                Suggested_Priority__c = c.priority,
                Suggested_Team__c = c.team,
                Recommended_Action__c = c.recommendedAction,
                Reasoning__c = c.reasoning,
                Evidence__c = String.join(evidence, '\n'),
                Confidence__c = c.confidence,
                Model_Version__c = c.modelVersion,
                Review_Status__c = 'Pending'
            ));
        }
        insert recs;
    }

    private static void upsertPatterns(List<Incident__c> incidents) {
        Map<String, Incident_Pattern__c> patterns = new Map<String, Incident_Pattern__c>();
        for (Incident__c inc : incidents) {
            if (!inc.Is_Recurring__c) {
                continue;
            }
            String k = key(inc.Location__c, inc.Category__c);
            Integer total = inc.Related_Incident_Count__c.intValue() + 1;
            Incident_Pattern__c existing = patterns.get(k);
            if (existing != null && existing.Incident_Count__c >= total) {
                continue;
            }
            patterns.put(k, new Incident_Pattern__c(
                Pattern_Key__c = k,
                Location__c = inc.Location__c,
                Category__c = inc.Category__c,
                Incident_Count__c = total,
                Window_Days__c = RECURRENCE_WINDOW_DAYS,
                Last_Seen__c = Datetime.now(),
                Status__c = 'Active',
                Summary__c = total + ' ' + String.valueOf(inc.Category__c).toLowerCase() +
                    ' incidents in ' + RECURRENCE_WINDOW_DAYS + ' days. Latest: ' + inc.Subject__c
            ));
        }
        if (!patterns.isEmpty()) {
            upsert patterns.values() Pattern_Key__c;
        }
    }
}
