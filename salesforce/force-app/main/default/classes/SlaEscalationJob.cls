/**
 * Escalates open incidents that have passed their SLA due date.
 * Schedule with: SlaEscalationJob.scheduleHourly();
 */
public with sharing class SlaEscalationJob implements Database.Batchable<SObject>, Schedulable {
    public static final String JOB_NAME = 'Pulse AI SLA Escalation';

    public Database.QueryLocator start(Database.BatchableContext ctx) {
        Datetime now = Datetime.now();
        return Database.getQueryLocator([
            SELECT Id, Escalation_Level__c, Status__c, SLA_Breached__c
            FROM Incident__c
            WHERE SLA_Due__c < :now AND Status__c NOT IN ('Resolved', 'Closed')
        ]);
    }

    public void execute(Database.BatchableContext ctx, List<Incident__c> scope) {
        for (Incident__c inc : scope) {
            Decimal level = inc.Escalation_Level__c == null ? 0 : inc.Escalation_Level__c;
            if (!inc.SLA_Breached__c) {
                inc.SLA_Breached__c = true;
                inc.Escalation_Level__c = level + 1;
            } else if (level < 3) {
                inc.Escalation_Level__c = level + 1;
            }
            inc.Status__c = 'Escalated';
        }
        update scope;
    }

    public void finish(Database.BatchableContext ctx) {
    }

    public void execute(SchedulableContext ctx) {
        Database.executeBatch(new SlaEscalationJob(), 200);
    }

    public static Id scheduleHourly() {
        return System.schedule(JOB_NAME, '0 5 * * * ?', new SlaEscalationJob());
    }
}
