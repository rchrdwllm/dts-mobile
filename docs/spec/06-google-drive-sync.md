# Specification: Google Drive Target Folder Sync

## Problem Statement
The app needs to upload scanned XML records directly to a designated public/shared Google Drive target folder using the authenticated user's Google session, without dynamically creating or searching for personal folders in each user's account.

## Solution
Use direct HTTP REST client requests (`multipart/related`) with the Google Drive REST API v3 to upload XML payloads directly to a pre-configured target folder ID using the logged-in user's OAuth access token.

## User Stories
1. As a mobile operator, I want to tap a "Save to Google Drive" button to sync the current scan so that the record is persisted.
2. As a mobile operator, I want the file to be uploaded directly into the central public/shared Google Drive target folder using my authenticated Google session.
3. As a mobile operator, I want to see a loading indicator during the upload.
4. As a mobile operator, I want to be notified of an upload failure immediately.
5. As a mobile operator, I want a successful upload to clear the scanned QR state.

## Implementation Decisions
* **API Version**: Google Drive API v3.
* **Target Destination**:
  * Uploads target a pre-configured central Google Drive target folder ID (`TARGET_FOLDER_ID`).
  * The target Google Drive folder must have general access configured as "Anyone with the link can edit" (Editor permission).
* **OAuth Scope & Auth**:
  * Users sign in via Google OAuth (`https://www.googleapis.com/auth/drive.file` scope).
  * The authenticated user's access token is passed in the `Authorization: Bearer <token>` header.
* **Multipart Upload Protocol**:
  * Send a `POST` request to `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.
  * Metadata specifies `parents: [TARGET_FOLDER_ID]` alongside `name` and `mimeType: application/xml`.
  * The payload contains both JSON metadata and the raw XML payload string separated by a boundary string.
* **Workflow**:
  * Step 1: Retrieve active Google OAuth access token (handling 401 token refresh if needed).
  * Step 2: Format the XML file payload as `Battery_DATA.xml`.
  * Step 3: Perform multipart upload targeting `TARGET_FOLDER_ID`.
  * Step 4: Reset UI state upon success and notify operator.
* **Deprecations / Removals**:
  * Dynamic folder searching (`findFolder`) and personal folder creation (`createFolder`) in user root are removed from the upload workflow.

## Testing Decisions
* **Seam**: HTTP fetch wrapper / Drive client utility (`uploadXmlFile` / `syncScanToGoogleDrive`).
* **Unit Tests**:
  * Mock `fetch` to verify multipart request format, correct `Authorization` headers, and `parents: [TARGET_FOLDER_ID]` metadata.
  * Verify 401 token refresh/retry behavior.
  * Verify error handling on network or HTTP errors.
* **Manual Verification**:
  * Verify uploaded XML files appear directly in the configured shared Google Drive target folder.

## Out of Scope
* Anonymous uploads without Google user authentication.
* Dynamic folder search and personal folder creation in individual user accounts.
* Automatic offline queuing or retries.

## Further Notes
* The target folder must be shared with edit permissions before uploads can succeed.

