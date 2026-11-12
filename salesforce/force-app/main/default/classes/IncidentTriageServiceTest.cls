@IsTest
private class IncidentTriageServiceTest {
    @TestSetup
    static void setup() {
        Location__c loc = PulseTestFactory.location('STORE-104');
        PulseTestFactory.asset(loc.Id, 'AP-104-01', 'Access Point');
    }

    static Location__c loc() {
        return [SELECT Id FROM Location__c WHERE Store_Code__c = 'STORE-104'];
    }

    @IsTest
    static void triagesAndCreatesRecommendation() {
        Incident__c inc = PulseTestFactory.incident(loc().Id, 'POS disconnecting', 'POS terminals keep disconnecting and the Wi-Fi is unstable');

        Test.startTest();
        insert inc;
        Test.stopTest();

        inc = [SELECT Category__c, Priority__c, Status__c, Assigned_Team__c, SLA_Due__c, AI_Confidence__c FROM Incident__c WHERE Id = :inc.Id];
        Assert.areEqual('Network', inc.Category__c);
        Assert.areEqual('High', inc.Priority__c);
        Assert.areEqual('Triaged', inc.Status__c);
        Assert.areEqual('Infrastructure', inc.Assigned_Team__c);
        Assert.isNotNull(inc.SLA_Due__c);

        AI_Recommendation__c rec = [SELECT Suggested_Priority__c, Review_Status__c, Evidence__c, Model_Version__c FROM AI_Recommendation__c WHERE Incident__c = :inc.Id];
        Assert.areEqual('High', rec.Suggested_Priority__c);
        Assert.areEqual('Pending', rec.Review_Status__c);
        Assert.areEqual(RuleBasedIncidentClassifier.MODEL_VERSION, rec.Model_Version__c);
        Assert.isTrue(rec.Evidence__c.contains('similar network incidents'));
    }

    @IsTest
    static void respectsUserProvidedPriority() {
        Incident__c inc = PulseTestFactory.incident(loc().Id, 'Wi-Fi unstable', 'wireless dropping');
        inc.Priority__c = 'Low';
        insert inc;
        Assert.areEqual('Low', [SELECT Priority__c FROM Incident__c WHERE Id = :inc.Id].Priority__c);
    }

    @IsTest
    static void detectsRecurringPatternInBulk() {
        Id locationId = loc().Id;
        List<Incident__c> batch = new List<Incident__c>();
        for (Integer i = 0; i < 5; i++) {
            batch.add(PulseTestFactory.incident(locationId, 'Wi-Fi down ' + i, 'wireless access point unstable'));
        }

        Test.startTest();
        insert batch;
        Test.stopTest();

        List<Incident__c> recurring = [SELECT Id FROM Incident__c WHERE Is_Recurring__c = TRUE];
        Assert.areEqual(2, recurring.size(), 'Incidents after the third in the window should be recurring');
        Incident_Pattern__c pattern = [SELECT Incident_Count__c, Category__c, Status__c FROM Incident_Pattern__c];
        Assert.areEqual('Network', pattern.Category__c);
        Assert.areEqual(5, pattern.Incident_Count__c);
        Assert.areEqual('Active', pattern.Status__c);
    }

    @IsTest
    static void flagsDuplicateForSameAsset() {
        Ops_Asset__c ap = [SELECT Id FROM Ops_Asset__c LIMIT 1];
        Incident__c first = PulseTestFactory.incident(loc().Id, 'AP offline', 'access point wireless down');
        first.Asset__c = ap.Id;
        insert first;

        Incident__c second = PulseTestFactory.incident(loc().Id, 'Wi-Fi again', 'wireless unstable');
        second.Asset__c = ap.Id;
        insert second;

        Assert.areEqual(first.Id, [SELECT Duplicate_Of__c FROM Incident__c WHERE Id = :second.Id].Duplicate_Of__c);
    }

    @IsTest
    static void stampsResolutionTimeAndRecalculatesSla() {
        Incident__c inc = PulseTestFactory.incident(loc().Id, 'Printer jam', 'receipt printer jams');
        insert inc;
        Datetime originalDue = [SELECT SLA_Due__c FROM Incident__c WHERE Id = :inc.Id].SLA_Due__c;

        inc.Priority__c = 'Critical';
        update inc;
        Datetime escalatedDue = [SELECT SLA_Due__c FROM Incident__c WHERE Id = :inc.Id].SLA_Due__c;
        Assert.isTrue(escalatedDue < originalDue, 'Critical SLA should be shorter');

        inc.Status__c = 'Resolved';
        update inc;
        Assert.isNotNull([SELECT Resolved_At__c FROM Incident__c WHERE Id = :inc.Id].Resolved_At__c);

        inc.Status__c = 'In Progress';
        update inc;
        Assert.isNull([SELECT Resolved_At__c FROM Incident__c WHERE Id = :inc.Id].Resolved_At__c);
    }

    @IsTest
    static void bulkInsertStaysWithinLimits() {
        Id locationId = loc().Id;
        List<Incident__c> batch = new List<Incident__c>();
        for (Integer i = 0; i < 200; i++) {
            batch.add(PulseTestFactory.incident(locationId, 'Issue ' + i, Math.mod(i, 2) == 0 ? 'printer jam' : 'password reset'));
        }
        Test.startTest();
        insert batch;
        Integer queries = Limits.getQueries();
        Test.stopTest();
        Assert.isTrue(queries < 10, 'Triage should use a constant number of queries, used ' + queries);
        Assert.areEqual(200, [SELECT COUNT() FROM AI_Recommendation__c]);
    }
}
