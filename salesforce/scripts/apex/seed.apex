// Seeds a demo dataset: 12 locations, assets and incidents that tell the
// Store 104 / 221 / 87 story. Run with:
//   sf apex run --file scripts/apex/seed.apex
List<String> cities = new List<String>{ 'Mississauga', 'Brampton', 'Oakville', 'Toronto', 'Markham', 'Vaughan', 'Hamilton', 'Burlington', 'Milton', 'Scarborough', 'Etobicoke', 'Guelph' };
List<String> regions = new List<String>{ 'GTA West', 'GTA West', 'GTA West', 'Central', 'GTA East', 'GTA North', 'Southwest', 'Southwest', 'GTA West', 'GTA East', 'Central', 'Southwest' };
List<Integer> stores = new List<Integer>{ 104, 221, 87, 163, 12, 48, 66, 98, 140, 204, 250, 301 };

List<Location__c> locs = new List<Location__c>();
for (Integer i = 0; i < stores.size(); i++) {
    locs.add(new Location__c(
        Name = 'Store ' + stores[i],
        Store_Code__c = 'STORE-' + stores[i],
        City__c = cities[i],
        Region__c = regions[i],
        Status__c = stores[i] == 204 ? 'Offline' : 'Online'
    ));
}
upsert locs Store_Code__c;

Map<String, String> prefixes = new Map<String, String>{ 'Router' => 'RTR', 'Access Point' => 'AP', 'POS Terminal' => 'POS', 'Receipt Printer' => 'PRN', 'HVAC Unit' => 'HVAC' };
List<Ops_Asset__c> assets = new List<Ops_Asset__c>();
for (Location__c l : locs) {
    String n = l.Store_Code__c.substringAfter('-');
    for (String type : prefixes.keySet()) {
        Boolean hot = (n == '104' && type == 'Router') || (n == '221' && type == 'POS Terminal') || (n == '87' && type == 'Receipt Printer');
        assets.add(new Ops_Asset__c(
            Name = prefixes.get(type) + '-' + n + '-01',
            Location__c = l.Id,
            Asset_Type__c = type,
            Install_Date__c = Date.today().addMonths(-(6 + Math.mod(Integer.valueOf(n), 60))),
            Last_Maintenance_Date__c = Date.today().addDays(-(30 + Math.mod(Integer.valueOf(n) * 7, 380))),
            Failure_Count__c = hot ? 9 : Math.mod(Integer.valueOf(n), 3),
            Risk_Score__c = hot ? 88 : Math.mod(Integer.valueOf(n) * 13, 60)
        ));
    }
}
insert assets;

Map<String, List<String>> reports = new Map<String, List<String>>{
    '104' => new List<String>{ 'POS terminals keep disconnecting every few minutes and the Wi-Fi seems unstable.', 'Wireless access point dropping, handhelds cannot connect.', 'Internet down, card payments failing at opening.' },
    '221' => new List<String>{ 'POS frozen on payment screen at checkout lane 2.', 'PIN pad not pairing, customers cannot tap to pay.' },
    '87' => new List<String>{ 'Receipt printer jams on almost every receipt.', 'Back office PC shows black screen after boot.' }
};
List<String> background = new List<String>{ 'Password reset needed for scheduling app.', 'Walk-in cooler temperature rising.', 'HVAC blowing warm air on sales floor.', 'Employee locked out of POS login.' };

List<Incident__c> incidents = new List<Incident__c>();
for (Location__c l : locs) {
    String n = l.Store_Code__c.substringAfter('-');
    List<String> texts = reports.containsKey(n) ? reports.get(n) : background;
    Integer volume = reports.containsKey(n) ? 6 : 2;
    for (Integer i = 0; i < volume; i++) {
        String text = texts[Math.mod(i + Integer.valueOf(n), texts.size())];
        incidents.add(new Incident__c(Location__c = l.Id, Subject__c = text.left(80), Description__c = text, Source__c = 'Manual'));
    }
}
insert incidents;
System.debug('Seeded ' + locs.size() + ' locations, ' + assets.size() + ' assets, ' + incidents.size() + ' incidents.');
