# 05a — Full-Screen Camera Interface & Dynamic Zoom Controls

**What to build:**
Enhance the camera QR scanner functionality by providing an expandable full-screen camera view and interactive zoom controls. Operators scanning QR codes in dark, distant, or physically awkward environments can tap an expand button on the camera scanner card to enter full-screen modal mode, toggle torch illumination, and select quick zoom levels (`1x`, `2x`, `3x`, `5x`) to scan small or distant QR codes cleanly. Successful scans automatically lock the result (capped at 9 characters), trigger feedback, and exit full-screen mode back to the main form preview.

**Blocked by:** 05 — Camera Viewport & Battery Serial No. QR Scanner State Lock

**Status:** ready-for-agent

- [ ] Expand button on the camera scanner card launches a full-screen camera modal overlay with full-bleed viewport.
- [ ] Full-screen camera interface features quick-select zoom preset pills (`1x`, `2x`, `3x`, `5x`) that update the `CameraView` zoom level dynamically between `0` (1x) and `1` (max zoom).
- [ ] Full-screen camera interface includes a torch / flashlight toggle for low-light scanning conditions.
- [ ] Viewfinder overlay and target alignment guides are rendered prominently in full-screen view.
- [ ] Scanning a valid QR code in full-screen mode locks the 9-character truncated Battery Serial No., updates the scanner card state, and closes full-screen mode.
- [ ] Clearing/Rescanning state resets zoom level and scanner state back to initial default.
