# 01 — Target Folder & Battery_DATA.xml Drive Sync Utility

**What to build:** Update the Google Drive sync utility to upload XML scan data directly to a pre-configured public/shared target folder using the authenticated user's Google session, with the file named `Battery_DATA.xml`, removing dynamic folder search and creation.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `syncScanToGoogleDrive` uploads directly to the configured target folder ID (`parents: [TARGET_FOLDER_ID]`).
- [ ] XML file name is formatted as `Battery_DATA.xml`.
- [ ] Unused dynamic folder search (`findFolder`) and personal folder creation (`createFolder`) calls are removed from the upload flow.
- [ ] Token expiration and 401 refresh handling remain functional.
