/**
 * Read model for the pulseCommandCenter LWC. All queries run in user mode so
 * results respect object, field and record-level security.
 */
public with sharing class CommandCenterController {
    public class Kpis {
        @AuraEnabled public Integer locationsOnline = 0;
        @AuraEnabled public Integer locationsTotal = 0;
        @AuraEnabled public Integer criticalIncidents = 0;
        @AuraEnabled public Integer openIncidents = 0;
        @AuraEnabled public Integer mttrMinutes = 0;
        @AuraEnabled public Integer slaCompliance = 100;
        @AuraEnabled public Integer recurringProblems = 0;
        @AuraEnabled public Integer assetsAtRisk = 0;
    }

    public class Slice {
        @AuraEnabled public String label;
        @AuraEnabled public Integer count;
        @AuraEnabled public Integer share;
        Slice(String label, Integer count, Integer total) {
            this.label = label;
            this.count = count;
            this.share = total == 0 ? 0 : Math.round(count * 100.0 / total).intValue();
        }
    }

    public class Overview {
        @AuraEnabled public Kpis kpis = new Kpis();
        @AuraEnabled public List<Slice> categories = new List<Slice>();
        @AuraEnabled public List<Slice> topLocations = new List<Slice>();
        @AuraEnabled public List<Ops_Asset__c> assetsAtRisk = new List<Ops_Asset__c>();
        @AuraEnabled public List<Incident__c> openIncidents = new List<Incident__c>();
    }

    public static final Decimal RISK_THRESHOLD = 70;

    @AuraEnabled(cacheable=true)
    public static Overview getOverview() {
        try {
            return build();
        } catch (Exception e) {
            throw new AuraHandledException('Unable to load the command center: ' + e.getMessage());
        }
    }

    @TestVisible
    private static Overview build() {
        Overview o = new Overview();
        Datetime since = Datetime.now().addDays(-30);

        for (AggregateResult ar : [SELECT Status__c status, COUNT(Id) total FROM Location__c WITH USER_MODE GROUP BY Status__c]) {
            Integer n = (Integer) ar.get('total');
            o.kpis.locationsTotal += n;
            if ((String) ar.get('status') != 'Offline') {
                o.kpis.locationsOnline += n;
            }
        }

        o.kpis.openIncidents = [SELECT COUNT() FROM Incident__c WHERE Status__c NOT IN ('Resolved', 'Closed') WITH USER_MODE];
        o.kpis.criticalIncidents = [
            SELECT COUNT() FROM Incident__c WHERE Status__c NOT IN ('Resolved', 'Closed') AND Priority__c = 'Critical' WITH USER_MODE
        ];

        // Formula fields cannot be aggregated, so MTTR is computed in Apex.
        Long totalMinutes = 0;
        Integer resolved = 0;
        for (Incident__c inc : [
            SELECT CreatedDate, Resolved_At__c FROM Incident__c
            WHERE Resolved_At__c >= :since WITH USER_MODE LIMIT 5000
        ]) {
            totalMinutes += (inc.Resolved_At__c.getTime() - inc.CreatedDate.getTime()) / 60000;
            resolved++;
        }
        o.kpis.mttrMinutes = resolved == 0 ? 0 : (totalMinutes / resolved).intValue();

        Integer recent = [SELECT COUNT() FROM Incident__c WHERE CreatedDate >= :since WITH USER_MODE];
        Integer breached = [SELECT COUNT() FROM Incident__c WHERE CreatedDate >= :since AND SLA_Breached__c = TRUE WITH USER_MODE];
        o.kpis.slaCompliance = recent == 0 ? 100 : Math.round((recent - breached) * 100.0 / recent).intValue();

        o.kpis.recurringProblems = [SELECT COUNT() FROM Incident_Pattern__c WHERE Status__c != 'Resolved' WITH USER_MODE];
        o.kpis.assetsAtRisk = [SELECT COUNT() FROM Ops_Asset__c WHERE Risk_Score__c >= :RISK_THRESHOLD WITH USER_MODE];

        for (AggregateResult ar : [
            SELECT Category__c cat, COUNT(Id) total FROM Incident__c
            WHERE CreatedDate >= :since AND Category__c != NULL
            WITH USER_MODE
            GROUP BY Category__c ORDER BY COUNT(Id) DESC
        ]) {
            o.categories.add(new Slice((String) ar.get('cat'), (Integer) ar.get('total'), recent));
        }

        for (AggregateResult ar : [
            SELECT Location__r.Name loc, COUNT(Id) total FROM Incident__c
            WHERE CreatedDate >= :since
            WITH USER_MODE
            GROUP BY Location__r.Name ORDER BY COUNT(Id) DESC LIMIT 5
        ]) {
            o.topLocations.add(new Slice((String) ar.get('loc'), (Integer) ar.get('total'), recent));
        }

        o.assetsAtRisk = [
            SELECT Id, Name, Asset_Type__c, Risk_Score__c, Failure_Count__c, Location__r.Name
            FROM Ops_Asset__c
            WHERE Risk_Score__c != NULL
            WITH USER_MODE
            ORDER BY Risk_Score__c DESC LIMIT 6
        ];

        o.openIncidents = [
            SELECT Id, Name, Subject__c, Priority__c, Status__c, Assigned_Team__c, Is_Recurring__c,
                SLA_Due__c, CreatedDate, Location__r.Name
            FROM Incident__c
            WHERE Status__c NOT IN ('Resolved', 'Closed')
            WITH USER_MODE
            ORDER BY CreatedDate DESC LIMIT 10
        ];
        return o;
    }
}
