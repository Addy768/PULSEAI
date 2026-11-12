/**
 * Turns monitoring events into incidents (and auto-resolves on recovery).
 * Runs as the Automated Process user, so it intentionally ignores sharing.
 */
public without sharing class DeviceAlertHandler {
    private static final Set<String> DOWN_STATES = new Set<String>{ 'OFFLINE', 'DOWN', 'DEGRADED', 'CRITICAL' };
    private static final Set<String> UP_STATES = new Set<String>{ 'ONLINE', 'UP', 'RECOVERED', 'OK' };

    public static void handle(List<Device_Alert__e> alerts) {
        Set<String> codes = new Set<String>();
        Set<String> devices = new Set<String>();
        for (Device_Alert__e a : alerts) {
            codes.add(a.Location_Code__c);
            devices.add(a.Device_Id__c);
        }

        Map<String, Location__c> locations = new Map<String, Location__c>();
        for (Location__c l : [SELECT Id, Store_Code__c FROM Location__c WHERE Store_Code__c IN :codes]) {
            locations.put(l.Store_Code__c, l);
        }
        Map<String, Ops_Asset__c> assets = new Map<String, Ops_Asset__c>();
        for (Ops_Asset__c asset : [SELECT Id, Name, Asset_Type__c FROM Ops_Asset__c WHERE Name IN :devices]) {
            assets.put(asset.Name, asset);
        }
        Map<String, List<Incident__c>> openByDevice = new Map<String, List<Incident__c>>();
        for (Incident__c inc : [
            SELECT Id, Device_Id__c, Status__c
            FROM Incident__c
            WHERE Device_Id__c IN :devices AND Status__c NOT IN ('Resolved', 'Closed')
        ]) {
            if (!openByDevice.containsKey(inc.Device_Id__c)) {
                openByDevice.put(inc.Device_Id__c, new List<Incident__c>());
            }
            openByDevice.get(inc.Device_Id__c).add(inc);
        }

        List<Incident__c> toInsert = new List<Incident__c>();
        List<Incident__c> toUpdate = new List<Incident__c>();
        Set<String> seen = new Set<String>();
        for (Device_Alert__e a : alerts) {
            String status = a.Status__c == null ? '' : a.Status__c.toUpperCase();
            Location__c loc = locations.get(a.Location_Code__c);
            if (loc == null) {
                continue;
            }
            if (DOWN_STATES.contains(status)) {
                if (openByDevice.containsKey(a.Device_Id__c) || seen.contains(a.Device_Id__c)) {
                    continue; // already tracked
                }
                seen.add(a.Device_Id__c);
                Ops_Asset__c asset = assets.get(a.Device_Id__c);
                String deviceLabel = asset != null && asset.Asset_Type__c != null ? asset.Asset_Type__c : 'Device';
                toInsert.add(new Incident__c(
                    Subject__c = deviceLabel + ' ' + a.Device_Id__c + ' ' + status.toLowerCase() + ' at ' + a.Location_Code__c,
                    Description__c = String.isBlank(a.Message__c) ? 'Monitoring reported ' + a.Device_Id__c + ' as ' + status + '.' : a.Message__c,
                    Location__c = loc.Id,
                    Asset__c = asset?.Id,
                    Device_Id__c = a.Device_Id__c,
                    Source__c = 'Monitoring',
                    Priority__c = status == 'DEGRADED' ? 'High' : 'Critical'
                ));
            } else if (UP_STATES.contains(status) && openByDevice.containsKey(a.Device_Id__c)) {
                for (Incident__c inc : openByDevice.get(a.Device_Id__c)) {
                    inc.Status__c = 'Resolved';
                    inc.Resolution_Notes__c = 'Auto-resolved: monitoring reported ' + a.Device_Id__c + ' as ' + status + '.';
                    toUpdate.add(inc);
                }
                openByDevice.remove(a.Device_Id__c);
            }
        }
        insert toInsert;
        update toUpdate;
    }
}
