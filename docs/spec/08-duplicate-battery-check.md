# Specification: Duplicate Battery Serial Verification

## Problem Statement

Operators scanning battery QR codes might accidentally scan the same battery multiple times or attempt to upload a battery serial number that has already been recorded in `Battery_DATA.xml` in Google Drive. Saving duplicate entries causes data redundancy and invalid record logs.

## Solution

Before appending and saving a new scan record to Google Drive, check if the scanned Battery Serial No. (`<BatteryCode>`) already exists in the `Battery_DATA.xml` file. If the battery code is already present, abort the sync operation and notify the operator via a user-facing alert without saving or corrupting the existing XML file.

## User Stories

1. As a mobile operator, I want the app to check if a scanned Battery Serial No. already exists in `Battery_DATA.xml` before saving, so that duplicate battery entries are not uploaded.
2. As a mobile operator, I want to receive a clear duplicate alert when attempting to save an already recorded battery serial, so that I understand why the save was prevented.
3. As a mobile operator, I want existing records in `Battery_DATA.xml` on Google Drive to remain untouched when a duplicate scan attempt occurs, so that data integrity is maintained.
4. As a mobile operator, I want to be able to scan new, unique battery serial numbers without interference from existing validation checks.

## Implementation Decisions

* **XML Duplicate Inspector Utility**:
  * Implement a pure JavaScript helper function to check if a given battery serial number exists within an XML payload string.
  * The utility escapes and sanitizes the target battery serial (up to 9 characters) and inspects `<BatteryCode>` tags across all `<Scan>` blocks.
  * Performs exact, case-insensitive comparison of trimmed battery serial values.

* **Google Drive Sync Pipeline Integration**:
  * In the Google Drive sync workflow, after downloading the existing `Battery_DATA.xml` file from Google Drive and prior to calling the append utility:
    * Run the XML duplicate inspector on the downloaded XML string.
    * If a match is found, throw a designated duplicate serial error and bypass media update/upload requests.

* **UI Feedback & Error Handling**:
  * Catch the duplicate serial error in the primary screen controller.
  * Present a user alert dialog titled `Duplicate Scan` explaining that the battery serial is already present in the target XML file.
  * Keep the current scan state intact so the user can inspect or reset the input.

## Testing Decisions

* **Test Seams**:
  * Unit test seam for the XML duplicate inspector utility (`batteryCodeExistsInXml`).
  * Integration/unit test seam for the Google Drive sync workflow wrapper (`syncScanToGoogleDrive`).

* **Testing Philosophy**:
  * Tests should verify observable external behavior (correct boolean return value on duplicate detection, error throwing during sync) rather than internal parsing mechanics.

* **Modules Tested**:
  * XML helper utility module.
  * Google Drive sync module.

* **Prior Art**:
  * `src/utils/__tests__/xml.test.ts` for XML string manipulation testing.
  * `src/utils/__tests__/gdrive.test.ts` for mocked Google Drive REST API fetch flows.

## Out of Scope

* Offline local database caching of scanned serials across application restarts.
* Batch deduplication or automated deletion of existing duplicates already present in `Battery_DATA.xml`.
* Real-time network pre-fetching on barcode scan prior to pressing the Save button.

## Further Notes

* Checking for duplicate battery codes after fetching the existing XML from Google Drive guarantees that validation always evaluates against the single source of truth stored in Google Drive.
