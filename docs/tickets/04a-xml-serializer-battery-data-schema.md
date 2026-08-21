# 04a — Update XML Serializer to match Battery_DATA.xml Schema

**What to build:** Update the XML serialization helper to output scan data formatted according to the `Battery_DATA.xml` schema layout (`<QRCodeScans><Scan>...`). The serialized payload must include `<BatteryCode>` from user input, `<DroneSerial>` from scanned QR data, `<Date>` formatted as `YYYY-MM-DD`, and empty tags for `<Replacement>`, `<FOM>`, `<FOMdate>`, `<FOM2>`, `<FOM2date>`, `<FOM3>`, and `<FOM3date>`.

**Blocked by:** 04 — XML Serializer & Scan Preview Card UI

**Status:** ready-for-agent

## Acceptance Criteria
- [ ] `serializeScanRecord` input interface accepts `batteryCode`, `droneSerial`, and optional `date` parameters.
- [ ] Output XML is wrapped in `<?xml version="1.0" encoding="utf-8"?><QRCodeScans><Scan>...` structure matching `Battery_DATA.xml`.
- [ ] `<Date>` element defaults to today's date formatted as `YYYY-MM-DD`.
- [ ] Empty tags (`<Replacement></Replacement>`, `<FOM></FOM>`, `<FOMdate></FOMdate>`, `<FOM2></FOM2>`, `<FOM2date></FOM2date>`, `<FOM3></FOM3>`, `<FOM3date></FOM3date>`) are included in the `<Scan>` block.
- [ ] Special characters in `<BatteryCode>` and `<DroneSerial>` are safely XML-escaped (`<`, `>`, `&`, `'`, `"`).
- [ ] Unit tests for `serializeScanRecord` and `escapeXml` pass.
