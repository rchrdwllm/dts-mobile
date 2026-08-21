# 02 — Update Preview Card and Google Drive Upload Payload Integration

**What to build:** Integrate the updated XML serializer into the scan preview UI card component and the Google Drive sync service so that scanned entries correctly display and upload XML formatted with `<BatteryCode>`, `<DroneSerial>`, and `<Date>`.

**Blocked by:** 01 — Update XML Serializer to match Battery_DATA.xml Schema

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] Scan preview card component (`ScanPreviewCard`) uses updated serializer field inputs (`batteryCode`, `droneSerial`, `date`).
- [ ] Google Drive upload helper (`uploadXmlFile` / `uploadBatteryDataXml`) builds and sends the updated XML payload structure.
- [ ] Preview card renders the accurate preview string matching `Battery_DATA.xml` format.
- [ ] Component and upload service unit tests pass.
