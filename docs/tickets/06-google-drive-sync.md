# 06 — Google Drive Folder Sync & Multipart Upload

**What to build:**
Implement direct HTTP REST integration with the Google Drive v3 API using OAuth tokens. On tapping "Save to Google Drive", search for the folder named `QRScannerGDrive`. If it does not exist, create it. Then, perform a multipart upload of the XML file `Scan_[InputNumber]_[Timestamp].xml` with parent set to the folder's ID. Provide a loading overlay/indicator during upload and show native notifications on success or failure, clearing the scanned QR state on success.

**Blocked by:**
- 01 — Native Google Sign-In Integration
- 05 — Camera Viewport & QR Scanner State Lock

**Status:** ready-for-agent

- [ ] Google Drive integration checks for presence of the `QRScannerGDrive` folder and creates it if not found.
- [ ] Multipart upload (multipart/related metadata + media payload) formats the request properly and uploads it to the correct folder.
- [ ] UI provides visual loading indications while the request is in progress, and handles network or authentication failures gracefully.
- [ ] On successful upload, scanned state resets and a success indicator is displayed.
- [ ] Unit tests verify HTTP requests (e.g. search queries, folder creation, and multipart payloads) use the expected endpoint, headers, and request structure.
