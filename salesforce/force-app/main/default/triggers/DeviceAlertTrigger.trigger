trigger DeviceAlertTrigger on Device_Alert__e (after insert) {
    DeviceAlertHandler.handle(Trigger.new);
}
