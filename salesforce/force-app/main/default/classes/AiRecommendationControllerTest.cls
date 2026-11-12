@IsTest
private class AiRecommendationControllerTest {
    @IsTest
    static void reviewsRecommendation() {
        Location__c loc = PulseTestFactory.location('STORE-12');
        Incident__c inc = PulseTestFactory.incident(loc.Id, 'Locked out', 'employee locked out of POS login');
        insert inc;

        AI_Recommendation__c rec = AiRecommendationController.getLatest(inc.Id);
        Assert.areEqual('Pending', rec.Review_Status__c);

        AiRecommendationController.review(rec.Id, 'Modified', 'Priority should be Low');
        rec = [SELECT Review_Status__c, Reviewer_Notes__c, Reviewed_By__c FROM AI_Recommendation__c WHERE Id = :rec.Id];
        Assert.areEqual('Modified', rec.Review_Status__c);
        Assert.areEqual(UserInfo.getUserId(), rec.Reviewed_By__c);
    }

    @IsTest
    static void rejectsInvalidDecision() {
        try {
            AiRecommendationController.review(null, 'Maybe', null);
            Assert.fail('Expected an exception');
        } catch (AuraHandledException e) {
            Assert.isTrue(true);
        }
    }

    @IsTest
    static void returnsNullWhenNoRecommendation() {
        Location__c loc = PulseTestFactory.location('STORE-13');
        Assert.isNull(AiRecommendationController.getLatest(loc.Id));
    }
}
