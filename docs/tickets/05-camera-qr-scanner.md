# 05 — Camera Viewport & Battery Serial No. QR Scanner State Lock

**What to build:**
Integrate the camera viewport using the modern Expo Camera module, displaying a stylized viewfinder overlay with alignment guides. Implement permission check logic, a permission-denied fallback button, scanning event triggers that automatically lock the scanner on detection, and a "Rescan" button overlaying the camera viewport to clear and unlock the state.

**Blocked by:** 04 — XML Serializer & Scan Preview Card UI

**Status:** ready-for-agent

- [ ] Camera permissions are requested dynamically, rendering a friendly fallback if permission is denied.
- [ ] Viewfinder displays a styled camera layout with a central target box indicator.
- [ ] Barcode scanning triggers instantly on 2D barcode detection (QR Code & Data Matrix), sanitizes non-alphanumeric control characters, saves the result (max 9 chars), and immediately stops scanning to prevent duplicate scans.
- [ ] Scanning a 2D barcode updates the XML serializer preview card with the scanned value.
- [ ] A "Rescan" action is shown when a scan is locked, allowing operators to clear the scanned state and start scanning again.
