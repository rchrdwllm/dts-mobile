# Specification: Google Drive Folder Sync

## Problem Statement
The app needs to automatically create a dedicated folder structure in Google Drive and upload individual XML files synchronously, showing progress and errors clearly.

## Solution
Implement direct HTTP REST client methods to check folder presence, create folders, and upload XML payloads using multipart format requests (`multipart/related`) with the Google Drive REST API.

## User Stories
1. As a mobile operator, I want to tap a "Save to Google Drive" button to sync the current scan so that the record is persisted.
2. As a mobile operator, I want the file to be saved to a specific `QRScannerGDrive` folder, creating it automatically if it does not exist.
3. As a mobile operator, I want to see a loading indicator during the upload.
4. As a mobile operator, I want to be notified of an upload failure immediately.
5. As a mobile operator, I want the upload to clear the scanned QR state.

## Implementation Decisions
* **API Version**: Google Drive API v3.
* **Multipart Upload Protocol**:
  * Send a `POST` request to `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.
  * The payload contains both metadata (name, parents, mimeType) and the raw XML string content separated by a boundary string.
* **Workflow**:
  * Step 1: Query Google Drive to search for folder `name = 'QRScannerGDrive' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`.
  * Step 2: If found, save its ID. If not found, make a POST to create it and capture the new folder ID.
  * Step 3: Perform multipart upload of the file `Scan_[InputNumber]_[Timestamp].xml` with parent set to the folder ID.
  * Step 4: Reset the UI state and display a success popup.

## Testing Decisions
* **Unit Tests**: Mock `fetch` functions to ensure requests (searches, uploads) contain the correct HTTP headers (specifically `Authorization: Bearer <token>`) and body parameters.
* **Manual Verification**: Verify that the file appears in the Google Drive app/web page under the `QRScannerGDrive` folder. Verify error triggers when Wi-Fi is disabled.

## Out of Scope
* Automatic retry mechanism or offline local queuing.

## Further Notes
* Requires real OAuth token access fetched in the login subfeature.
