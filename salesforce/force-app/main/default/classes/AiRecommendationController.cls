/**
 * Human-in-the-loop review of AI triage output.
 */
public with sharing class AiRecommendationController {
    private static final Set<String> DECISIONS = new Set<String>{ 'Approved', 'Modified', 'Rejected' };

    @AuraEnabled(cacheable=true)
    public static AI_Recommendation__c getLatest(Id incidentId) {
        List<AI_Recommendation__c> recs = [
            SELECT Id, Name, Suggested_Category__c, Suggested_Subcategory__c, Suggested_Priority__c,
                Suggested_Team__c, Recommended_Action__c, Reasoning__c, Evidence__c, Confidence__c,
                Review_Status__c, Reviewer_Notes__c, Model_Version__c, Reviewed_At__c
            FROM AI_Recommendation__c
            WHERE Incident__c = :incidentId
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        return recs.isEmpty() ? null : recs[0];
    }

    @AuraEnabled
    public static AI_Recommendation__c review(Id recommendationId, String decision, String notes) {
        if (!DECISIONS.contains(decision)) {
            throw new AuraHandledException('Decision must be Approved, Modified or Rejected.');
        }
        AI_Recommendation__c rec = new AI_Recommendation__c(
            Id = recommendationId,
            Review_Status__c = decision,
            Reviewer_Notes__c = notes,
            Reviewed_By__c = UserInfo.getUserId(),
            Reviewed_At__c = Datetime.now()
        );
        try {
            Database.update(rec, AccessLevel.USER_MODE);
        } catch (DmlException e) {
            throw new AuraHandledException(e.getDmlMessage(0));
        }
        return rec;
    }
}
