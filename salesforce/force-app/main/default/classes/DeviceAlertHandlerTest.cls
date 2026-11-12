@IsTest
private class DeviceAlertHandlerTest {
    @TestSetup
    static void setup() {
        Location__c loc = PulseTestFactory.location('STORE-104');
        PulseTestFactory.asset(loc.Id, 'ROUTER-02', 'Router');
    }

    static Device_Alert__e alert(String status) {
        return new Device_Alert__e(Location_Code__c = 'STORE-104', Device_Id__c = 'ROUTER-02', Status__c = status, Severity__c = 'High');
    }

    @IsTest
    static void offlineAlertCreatesCriticalIncident() {
        Test.startTest();
        EventBus.publish(alert('OFFLINE'));
        Test.stopTest();

        Incident__c inc = [SELECT Priority__c, Source__c, Asset__c, Category__c, Assigned_Team__c FROM Incident__c];
        Assert.areEqual('Critical', inc.Priority__c);
        Assert.areEqual('Monitoring', inc.Source__c);
        Assert.isNotNull(inc.Asset__c);
        Assert.areEqual('Network', inc.Category__c);
        Assert.areEqual('Infrastructure', inc.Assigned_Team__c);
    }

    @IsTest
    static void repeatedAlertsDoNotDuplicate() {
        Test.startTest();
        EventBus.publish(new List<Device_Alert__e>{ alert('OFFLINE'), alert('OFFLINE') });
        Test.stopTest();
        Assert.areEqual(1, [SELECT COUNT() FROM Incident__c]);
    }

    @IsTest
    static void recoveryAutoResolves() {
        EventBus.publish(alert('OFFLINE'));
        Test.getEventBus().deliver();

        Test.startTest();
        EventBus.publish(alert('ONLINE'));
        Test.stopTest();

        Incident__c inc = [SELECT Status__c, Resolved_At__c, Resolution_Notes__c FROM Incident__c];
        Assert.areEqual('Resolved', inc.Status__c);
        Assert.isNotNull(inc.Resolved_At__c);
        Assert.isTrue(inc.Resolution_Notes__c.startsWith('Auto-resolved'));
    }

    @IsTest
    static void unknownLocationIsIgnored() {
        Test.startTest();
        EventBus.publish(new Device_Alert__e(Location_Code__c = 'STORE-999', Device_Id__c = 'X', Status__c = 'OFFLINE'));
        Test.stopTest();
        Assert.areEqual(0, [SELECT COUNT() FROM Incident__c]);
    }
}
