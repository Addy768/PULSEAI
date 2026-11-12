trigger IncidentTrigger on Incident__c (before insert, before update, after insert) {
    IncidentTriggerHandler.run();
}
