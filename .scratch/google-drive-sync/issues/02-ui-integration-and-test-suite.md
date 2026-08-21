# 02 — UI Integration & Test Suite Alignment

**What to build:** Align the main screen save flow and unit test suite with the target folder upload mechanism and `Battery_DATA.xml` filename format.

**Blocked by:** 01 — Target Folder & Battery_DATA.xml Drive Sync Utility

**Status:** ready-for-agent

- [ ] Main app screen sync interaction (`index.tsx`) cleanly invokes the target folder upload flow.
- [ ] Unit tests in `gdrive.test.ts` verify fetch multipart upload parameters (`parents: [TARGET_FOLDER_ID]`, filename `Battery_DATA.xml`).
- [ ] Unit tests in `index.test.tsx` pass without errors.
- [ ] `npx tsc --noEmit` and `npx expo lint` pass with zero errors.
