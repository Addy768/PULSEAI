@IsTest
private class RuleBasedIncidentClassifierTest {
    @IsTest
    static void classifiesWirelessPosIssueAsHighNetwork() {
        IncidentClassification c = new RuleBasedIncidentClassifier().classify(
            'POS disconnecting',
            'Our POS terminals keep disconnecting every few minutes and the Wi-Fi seems unstable.'
        );
        Assert.areEqual('Network', c.category);
        Assert.areEqual('Wireless connectivity', c.subcategory);
        Assert.areEqual('High', c.priority);
        Assert.areEqual('Infrastructure', c.team);
        Assert.isTrue(c.confidence > 55, 'Multiple keyword hits should raise confidence');
        Assert.isTrue(c.isClassified());
    }

    @IsTest
    static void classifiesColdChainAsCritical() {
        IncidentClassification c = new RuleBasedIncidentClassifier().classify('Walk-in cooler warm', 'Temperature in the cooler is rising');
        Assert.areEqual('Facilities', c.category);
        Assert.areEqual('Critical', c.priority);
    }

    @IsTest
    static void unknownTextFallsBackToServiceDesk() {
        IncidentClassification c = new RuleBasedIncidentClassifier().classify('Question', 'When is the next team meeting?');
        Assert.areEqual('Other', c.category);
        Assert.areEqual('Service Desk', c.team);
        Assert.isFalse(c.isClassified());
    }

    @IsTest
    static void handlesNullInput() {
        IncidentClassification c = new RuleBasedIncidentClassifier().classify(null, null);
        Assert.areEqual('Other', c.category);
    }
}
