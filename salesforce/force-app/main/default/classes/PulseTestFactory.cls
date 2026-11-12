@IsTest
public class PulseTestFactory {
    public static Location__c location(String code) {
        Location__c l = new Location__c(Name = code.replace('STORE-', 'Store '), Store_Code__c = code, City__c = 'Mississauga', Region__c = 'GTA West');
        insert l;
        return l;
    }

    public static Ops_Asset__c asset(Id locationId, String tag, String type) {
        Ops_Asset__c a = new Ops_Asset__c(Name = tag, Location__c = locationId, Asset_Type__c = type, Risk_Score__c = 20);
        insert a;
        return a;
    }

    public static Incident__c incident(Id locationId, String subject, String description) {
        return new Incident__c(Location__c = locationId, Subject__c = subject, Description__c = description);
    }
}
