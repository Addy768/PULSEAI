// Simulates an external monitoring service reporting a router outage.
EventBus.publish(new Device_Alert__e(
    Location_Code__c = 'STORE-104',
    Device_Id__c = 'RTR-104-01',
    Status__c = 'OFFLINE',
    Severity__c = 'Critical',
    Message__c = 'Edge router RTR-104-01 stopped responding to heartbeat checks.'
));
