/**
 * Resolves SLA targets from SLA_Policy__mdt with safe defaults.
 */
public inherited sharing class SlaService {
    private static final Map<String, Integer> DEFAULT_RESOLUTION = new Map<String, Integer>{
        'Critical' => 60, 'High' => 240, 'Medium' => 480, 'Low' => 1440
    };

    private static Map<String, SLA_Policy__mdt> policies {
        get {
            if (policies == null) {
                policies = new Map<String, SLA_Policy__mdt>();
                for (SLA_Policy__mdt p : SLA_Policy__mdt.getAll().values()) {
                    policies.put(p.Priority__c, p);
                }
            }
            return policies;
        }
        set;
    }

    public static Integer resolutionMinutes(String priority) {
        String key = String.isBlank(priority) ? 'Medium' : priority;
        SLA_Policy__mdt p = policies.get(key);
        if (p != null && p.Resolution_Minutes__c != null) {
            return p.Resolution_Minutes__c.intValue();
        }
        return DEFAULT_RESOLUTION.containsKey(key) ? DEFAULT_RESOLUTION.get(key) : 480;
    }

    public static Datetime dueDate(String priority, Datetime start) {
        return (start == null ? Datetime.now() : start).addMinutes(resolutionMinutes(priority));
    }
}
