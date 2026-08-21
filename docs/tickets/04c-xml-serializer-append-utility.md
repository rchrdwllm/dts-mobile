# 04c — XML Serializer Append Utility (appendScanToXml)

**What to build:** Implement a pure JavaScript helper `appendScanToXml(existingXml, newScanData)` in `src/utils/xml.ts` that parses an existing `Battery_DATA.xml` string and appends/inserts a new `<Scan>...</Scan>` entry inside the `<QRCodeScans>` container element. If the existing XML string is empty, missing, or malformed, it falls back to creating a fresh root `Battery_DATA.xml` document.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Acceptance Criteria
- [x] `appendScanToXml(existingXml, scanData)` inserts a new formatted `<Scan>...</Scan>` block directly before `</QRCodeScans>` when `existingXml` is valid.
- [x] Fallback logic produces a fresh XML document with `<?xml version="1.0" encoding="utf-8"?><QRCodeScans><Scan>...</Scan></QRCodeScans>` structure when `existingXml` is null, empty, or invalid.
- [x] Fields (`<BatteryCode>`, `<DroneSerial>`) in the appended scan entry are safely XML-escaped (`<`, `>`, `&`, `'`, `"`).
- [x] Comprehensive unit tests cover single scan insertion, multi-scan document insertion, and malformed/empty XML fallbacks.
