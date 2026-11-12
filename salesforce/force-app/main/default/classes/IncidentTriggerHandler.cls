public with sharing class IncidentTriggerHandler {
    @TestVisible
    private static Boolean bypass = false;

    public static void run() {
        if (bypass) {
            return;
        }
        if (Trigger.isBefore && Trigger.isInsert) {
            IncidentTriageService.triage((List<Incident__c>) Trigger.new);
        } else if (Trigger.isBefore && Trigger.isUpdate) {
            IncidentTriageService.beforeUpdate((List<Incident__c>) Trigger.new, (Map<Id, Incident__c>) Trigger.oldMap);
        } else if (Trigger.isAfter && Trigger.isInsert) {
            IncidentTriageService.afterInsert((List<Incident__c>) Trigger.new);
        }
    }
}
