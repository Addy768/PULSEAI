@IsTest
private class SlaEscalationJobTest {
    @IsTest
    static void escalatesOverdueIncidents() {
        Location__c loc = PulseTestFactory.location('STORE-221');
        Incident__c overdue = PulseTestFactory.incident(loc.Id, 'POS frozen', 'pos frozen at checkout');
        Incident__c onTime = PulseTestFactory.incident(loc.Id, 'Password reset', 'password reset needed');
        insert new List<Incident__c>{ overdue, onTime };

        overdue.SLA_Due__c = Datetime.now().addHours(-1);
        update overdue;

        Test.startTest();
        Database.executeBatch(new SlaEscalationJob());
        Test.stopTest();

        overdue = [SELECT Status__c, SLA_Breached__c, Escalation_Level__c FROM Incident__c WHERE Id = :overdue.Id];
        Assert.areEqual('Escalated', overdue.Status__c);
        Assert.isTrue(overdue.SLA_Breached__c);
        Assert.areEqual(1, overdue.Escalation_Level__c);
        Assert.areNotEqual('Escalated', [SELECT Status__c FROM Incident__c WHERE Id = :onTime.Id].Status__c);
    }

    @IsTest
    static void schedulesHourlyJob() {
        Test.startTest();
        Id jobId = SlaEscalationJob.scheduleHourly();
        Test.stopTest();
        Assert.isNotNull(jobId);
    }
}
