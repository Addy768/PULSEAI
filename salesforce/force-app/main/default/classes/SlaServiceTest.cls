@IsTest
private class SlaServiceTest {
    @IsTest
    static void criticalIsShorterThanLow() {
        Assert.isTrue(SlaService.resolutionMinutes('Critical') < SlaService.resolutionMinutes('Low'));
    }

    @IsTest
    static void blankPriorityDefaultsToMedium() {
        Assert.areEqual(SlaService.resolutionMinutes('Medium'), SlaService.resolutionMinutes(null));
    }

    @IsTest
    static void unknownPriorityUsesFallback() {
        Assert.areEqual(480, SlaService.resolutionMinutes('Unknown'));
    }

    @IsTest
    static void dueDateAddsResolutionWindow() {
        Datetime start = Datetime.newInstanceGmt(2026, 1, 1, 9, 0, 0);
        Assert.areEqual(start.addMinutes(SlaService.resolutionMinutes('High')), SlaService.dueDate('High', start));
    }
}
