# Specification: Google Drive Target Folder Sync

## Problem Statement
The app needs to sync scanned entries into a centralized `Battery_DATA.xml` file located in a designated Google Drive target folder. Rather than creating standalone single-scan files or overwriting existing records with only the newest scan, the app must fetch the existing `Battery_DATA.xml` file from Google Drive (if present), parse and append the new scan record, and upload the updated document back to Google Drive (updating the existing file or overwriting/re-uploading).

## Solution
Use Google Drive REST API v3 to:
1. Search the target folder ID (`TARGET_FOLDER_ID`) for an existing `Battery_DATA.xml` file.
2. If found, download the existing XML string (`GET /drive/v3/files/{fileId}?alt=media`), append the new scan record using the XML serializer utility (`appendScanToXml`), and upload the updated XML back to Google Drive (via `PATCH /upload/drive/v3/files/{fileId}?uploadType=media` or delete then re-upload).
3. If not found, format a new `Battery_DATA.xml` containing the initial scan and create the file in the target folder via multipart upload (`POST /upload/drive/v3/files?uploadType=multipart`).

## User Stories
1. As a mobile operator, I want to tap a "Save to Google Drive" button to sync the current scan into `Battery_DATA.xml`.
2. As a mobile operator, I want the app to locate and fetch the existing `Battery_DATA.xml` file from the shared target folder so that existing scan data is preserved.
3. As a mobile operator, I want new scans to be appended to the existing `Battery_DATA.xml` file before uploading back to Google Drive.
4. As a mobile operator, I want a new `Battery_DATA.xml` file to be created automatically if it does not yet exist in the target folder.
5. As a mobile operator, I want to see a clear loading/sync status indicator during the fetch-append-upload process.
6. As a mobile operator, I want to be notified immediately if any step of the sync process fails.
7. As a mobile operator, I want a successful upload sync to clear the scanned QR state.

## Implementation Decisions
* **API Version**: Google Drive API v3.
* **Target Destination**:
  * Uploads target a pre-configured central Google Drive target folder ID (`TARGET_FOLDER_ID`).
  * The target Google Drive folder must have general access configured as "Anyone with the link can edit" (Editor permission).
* **OAuth Scope & Auth**:
  * Users sign in via Google OAuth (`https://www.googleapis.com/auth/drive.file` scope).
  * The authenticated user's access token is passed in the `Authorization: Bearer <token>` header.
* **Sync Workflow**:
  * **Step 1: Check existing file**:
    * Perform search query: `GET https://www.googleapis.com/drive/v3/files?q=name='Battery_DATA.xml'+and+'TARGET_FOLDER_ID'+in+parents+and+trashed=false`.
  * **Step 2: Read & Validate Duplicate & Append (if file exists)**:
    * Download existing file content: `GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media`.
    * Validate duplicate serial: Run `batteryCodeExistsInXml(existingXmlContent, batteryCode)`. If `true`, abort sync operation and throw duplicate serial error.
    * Append new scan entry using XML serializer helper: `updatedXml = appendScanToXml(existingXmlContent, newScanData)`.
    * Update/Overwrite existing file in Google Drive:
      * Option A (Direct Media Update): `PATCH https://www.googleapis.com/upload/drive/v3/files/{fileId}?uploadType=media` with `Content-Type: application/xml` and `updatedXml` body.
      * Option B (Delete & Re-upload): Delete file `DELETE https://www.googleapis.com/drive/v3/files/{fileId}` then perform multipart upload to `TARGET_FOLDER_ID`.
  * **Step 3: Initial Upload (if file does not exist)**:
    * Generate fresh XML document containing single scan entry.
    * Perform multipart upload: `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.
    * Metadata specifies `parents: [TARGET_FOLDER_ID]`, `name: 'Battery_DATA.xml'`, and `mimeType: application/xml`.
  * **Step 4: State Reset**:
    * Reset UI scan state upon successful sync and notify operator.
* **Error Handling & Fallbacks**:
  * Automatic token refresh on 401 response.
  * Corrupted existing XML handling: If reading existing `Battery_DATA.xml` fails to parse or is empty/corrupt, append fallback creates a fresh root XML document.

## Testing Decisions
* **Seam**: HTTP fetch wrapper / Drive sync client utility (`syncScanToGoogleDrive`).
* **Unit Tests**:
  * Mock `fetch` sequence for existing file case:
    1. Search query returns file ID.
    2. Download request fetches existing XML content.
    3. Update/PATCH request sends appended XML content containing both old and new records.
  * Mock `fetch` sequence for non-existent file case:
    1. Search query returns empty items list.
    2. POST request creates new `Battery_DATA.xml` with multipart payload in `TARGET_FOLDER_ID`.
  * Verify 401 token refresh/retry behavior.
  * Verify error handling on search, download, or upload failure.
* **Manual Verification**:
  * Verify `Battery_DATA.xml` in target Google Drive folder receives new `<Scan>` entries sequentially without overwriting previous scan entries.

## Out of Scope
* Anonymous uploads without Google user authentication.
* Conflict resolution for simultaneous concurrent offline syncs from multiple mobile devices (last write wins).
* Local background sync queues.

## Further Notes
* Updating existing `Battery_DATA.xml` directly maintains a single central XML log file in the target folder for all operators.


