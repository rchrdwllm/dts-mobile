# 08 — Duplicate Battery Serial Check Before Saving

**What to build:** Implement `batteryCodeExistsInXml` in `src/utils/xml.ts` to inspect XML strings for existing `<BatteryCode>` values. Integrate this check into `syncScanToGoogleDrive` in `src/utils/gdrive.ts` to abort saving if the battery serial is already present in `Battery_DATA.xml`, and update `src/app/index.tsx` to notify the operator via a user-facing duplicate alert.

**Blocked by:** 06c — Google Drive Target Folder Fetch & Append Sync Workflow

**Status:** ready-for-agent

## Acceptance Criteria
- [x] `batteryCodeExistsInXml(xmlContent, batteryCode)` returns `true` if `<BatteryCode>` matching `batteryCode` exists in the XML string (case-insensitive, trimmed).
- [x] `syncScanToGoogleDrive` fetches existing `Battery_DATA.xml`, runs `batteryCodeExistsInXml`, and throws a duplicate error if found, preventing any update or upload to Google Drive.
- [x] `HomeScreen` catches duplicate errors and displays a clear `Duplicate Scan` alert dialog.
- [x] Unit tests cover `batteryCodeExistsInXml` matching scenarios and `syncScanToGoogleDrive` duplicate save prevention flow.
