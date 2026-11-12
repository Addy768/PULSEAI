@IsTest
private class CommandCenterControllerTest {
    @IsTest
    static void buildsOverview() {
        Location__c loc = PulseTestFactory.location('STORE-87');
        Ops_Asset__c risky = PulseTestFactory.asset(loc.Id, 'RTR-87-01', 'Router');
        risky.Risk_Score__c = 82;
        update risky;

        List<Incident__c> incs = new List<Incident__c>();
        for (Integer i = 0; i < 4; i++) {
            incs.add(PulseTestFactory.incident(loc.Id, 'Internet down ' + i, 'no internet, card payments failing'));
        }
        insert incs;
        incs[0].Status__c = 'Resolved';
        update incs[0];

        Test.startTest();
        CommandCenterController.Overview o = CommandCenterController.getOverview();
        Test.stopTest();

        Assert.areEqual(1, o.kpis.locationsTotal);
        Assert.areEqual(1, o.kpis.locationsOnline);
        Assert.areEqual(3, o.kpis.openIncidents);
        Assert.areEqual(3, o.kpis.criticalIncidents);
        Assert.areEqual(1, o.kpis.assetsAtRisk);
        Assert.areEqual(1, o.kpis.recurringProblems);
        Assert.areEqual('Network', o.categories[0].label);
        Assert.areEqual(100, o.categories[0].share);
        Assert.areEqual(3, o.openIncidents.size());
        Assert.areEqual('RTR-87-01', o.assetsAtRisk[0].Name);
    }
}
