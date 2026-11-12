/**
 * Deterministic keyword classifier. Acts as the offline baseline and as the
 * fallback when the external AI service is unavailable.
 */
public with sharing class RuleBasedIncidentClassifier implements IIncidentClassifier {
    public static final String MODEL_VERSION = 'rules-v1';

    private class Rule {
        String category;
        String subcategory;
        String system;
        String priority;
        String team;
        String action;
        List<String> keywords;

        Rule(String category, String subcategory, String system, String priority, String team, String action, List<String> keywords) {
            this.category = category;
            this.subcategory = subcategory;
            this.system = system;
            this.priority = priority;
            this.team = team;
            this.action = action;
            this.keywords = keywords;
        }
    }

    // Ordered from most to least specific; the highest keyword score wins.
    private static final List<Rule> RULES = new List<Rule>{
        new Rule('Network', 'WAN outage', 'Payments', 'Critical', 'Infrastructure',
            'Verify ISP circuit status, power-cycle edge router and fail over to LTE backup.',
            new List<String>{ 'internet down', 'no internet', 'card payments', 'payments failing', 'offline', 'outage' }),
        new Rule('Network', 'Wireless connectivity', 'POS', 'High', 'Infrastructure',
            'Check access point connectivity and DHCP lease behaviour; review AP firmware version.',
            new List<String>{ 'wi-fi', 'wifi', 'wireless', 'disconnect', 'access point', 'unstable', 'signal' }),
        new Rule('Network', 'Latency', 'Inventory', 'Medium', 'Infrastructure',
            'Run a bandwidth test and check for a saturated uplink or QoS misconfiguration.',
            new List<String>{ 'slow network', 'latency', 'slow', 'bandwidth', 'router' }),
        new Rule('POS', 'Application hang', 'POS', 'High', 'Service Desk',
            'Clear the POS application cache and apply the latest POS client patch.',
            new List<String>{ ' pos', 'register', 'frozen', 'freezes', 'checkout', ' till ' }),
        new Rule('POS', 'Peripheral pairing', 'Payments', 'High', 'Field Tech',
            'Re-pair the PIN pad, confirm driver and swap the cable if needed.',
            new List<String>{ 'pin pad', 'pinpad', 'tap to pay', 'card reader' }),
        new Rule('Hardware', 'Printer fault', 'POS', 'Medium', 'Field Tech',
            'Inspect print head and cutter; replace the printer if failure count exceeds threshold.',
            new List<String>{ 'printer', 'jam', 'receipt' }),
        new Rule('Hardware', 'Workstation failure', 'Workstation', 'Medium', 'Field Tech',
            'Run hardware diagnostics; re-image from the golden image if the disk is healthy.',
            new List<String>{ ' pc ', 'computer', 'boot', 'black screen', 'laptop', 'monitor' }),
        new Rule('Accounts', 'Account lockout', 'Identity', 'Medium', 'Identity',
            'Unlock the account and confirm role assignment for the location.',
            new List<String>{ 'locked', 'lockout', 'cannot log', 'can\'t log', 'login' }),
        new Rule('Accounts', 'Password reset', 'Identity', 'Low', 'Identity',
            'Trigger a self-service reset and verify the email on the employee record.',
            new List<String>{ 'password', 'reset', 'credentials' }),
        new Rule('Facilities', 'Refrigeration', 'Cold chain', 'Critical', 'Facilities',
            'Dispatch refrigeration vendor and move perishables to backup cooling.',
            new List<String>{ 'cooler', 'freezer', 'fridge', 'refrigerat', 'temperature' }),
        new Rule('Facilities', 'HVAC', 'Building', 'Medium', 'Facilities',
            'Check filters and refrigerant pressure; schedule an HVAC vendor visit.',
            new List<String>{ 'hvac', 'air conditioning', 'heating', 'too hot', 'too cold', 'warm air' })
    };

    public IncidentClassification classify(String subject, String description) {
        String text = (' ' + (subject == null ? '' : subject) + ' ' + (description == null ? '' : description) + ' ').toLowerCase();
        Rule best;
        Integer bestScore = 0;
        for (Rule r : RULES) {
            Integer score = 0;
            for (String k : r.keywords) {
                if (text.contains(k)) {
                    score++;
                }
            }
            if (score > bestScore) {
                best = r;
                bestScore = score;
            }
        }

        IncidentClassification c = new IncidentClassification();
        c.modelVersion = MODEL_VERSION;
        if (best == null) {
            c.category = 'Other';
            c.priority = 'Medium';
            c.team = 'Service Desk';
            c.confidence = 30;
            c.reasoning = 'No known pattern matched; routed to the service desk for manual triage.';
            return c;
        }
        c.category = best.category;
        c.subcategory = best.subcategory;
        c.affectedSystem = best.system;
        c.priority = best.priority;
        c.team = best.team;
        c.recommendedAction = best.action;
        c.confidence = Math.min(95, 55 + bestScore * 12);
        c.reasoning = reasonFor(best);
        return c;
    }

    private static String reasonFor(Rule r) {
        if (r.priority == 'Critical' || r.priority == 'High') {
            return r.system + ' unavailable or degraded at an active business location.';
        }
        return 'Limited operational impact; ' + r.subcategory.toLowerCase() + ' with a known fix.';
    }
}
