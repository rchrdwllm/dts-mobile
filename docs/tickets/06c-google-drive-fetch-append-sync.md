# 06c — Google Drive Target Folder Fetch & Append Sync Workflow

**What to build:** Update `syncScanToGoogleDrive` utility to fetch the existing `Battery_DATA.xml` file from the designated Google Drive target folder (`TARGET_FOLDER_ID`), append the new scan record using `appendScanToXml`, and update/overwrite the file in Google Drive. If `Battery_DATA.xml` does not exist in the target folder, create a new file via multipart upload.

**Blocked by:** 04c — XML Serializer Append Utility (appendScanToXml)

**Status:** ready-for-agent

## Acceptance Criteria
- [x] `syncScanToGoogleDrive` queries Google Drive API v3 for an existing `Battery_DATA.xml` file inside `TARGET_FOLDER_ID`.
- [x] If file exists, downloads current file media (`GET /drive/v3/files/{fileId}?alt=media`), appends the new scan record using `appendScanToXml`, and updates/overwrites the file in Google Drive (`PATCH /upload/drive/v3/files/{fileId}?uploadType=media` or delete + multipart upload).
- [x] If file does not exist, formats a fresh root XML payload and creates `Battery_DATA.xml` in `TARGET_FOLDER_ID` via multipart `POST`.
- [x] Token refresh (401 response handling) and error reporting remain fully functional throughout search, fetch, append, and upload steps.
- [x] Unit tests mock the complete `fetch` sequence for existing file append/update and initial file creation scenarios.
