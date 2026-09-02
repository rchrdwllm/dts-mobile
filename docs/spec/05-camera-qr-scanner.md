# Specification: Camera 2D Scanner View (Battery Serial No.)

## Problem Statement
Users need a fast, low-friction mechanism to capture physical 2D barcodes (standard QR codes and Data Matrix codes) containing the Battery Serial No. using the phone's native camera sensor without manual configuration. The captured Battery Serial No. must be sanitized to strip any leading or unprintable ASCII control characters (such as GS1 header bytes encoded in Data Matrix codes) and restricted to a maximum of 9 alphanumeric characters.

## Solution
Use `expo-camera` with the unified `CameraView` component configured with `barcodeScannerSettings={{ barcodeTypes: ['qr', 'datamatrix'] }}`. Apply stylized boundaries on the scanner layout and implement scanning callbacks that automatically pause capture after a successful read to avoid multiple triggers. Sanitize the scanned raw data using `sanitizeAlphanumeric(data, 9)` to strip control characters/symbols and cap the final payload to a maximum of 9 characters.

## User Stories
1. As a mobile operator, I want to grant camera access to the app so that I can scan physical QR codes and Data Matrix codes.
2. As a mobile operator, I want a styled camera viewfinder overlay with scanning target guides so that I can easily align the camera to the barcode.
3. As a mobile operator, I want the scanner to immediately parse the barcode string upon detection so that I do not experience scanning delays.
4. As a mobile operator, I want the scanner to pause and lock its state upon success so that the same code is not scanned repeatedly.
5. As a mobile operator, I want non-printable ASCII control characters stripped and the captured Battery Serial No. payload capped at 9 alphanumeric characters so that the serial format remains valid and compliant.
6. As a mobile operator, I want to see the captured scan details (Battery Serial No., Drone Serial No., and date/time) in a preview card so that I can verify the data.

## Implementation Decisions
* **Library**: `expo-camera` (using the modern `CameraView` component).
* **Barcode Support**: `barcodeScannerSettings={{ barcodeTypes: ['qr', 'datamatrix'] }}` to detect both standard QR codes and industrial Data Matrix stickers.
* **Permissions Flow**: Use the `useCameraPermissions()` hook to check and prompt for camera authorization. Render a clean fallback button if permission is denied.
* **Viewport Overlay**: Draw an overlay over the `CameraView` depicting a scanning square target indicator.
* **Scan Lock & Payload Sanitization**: Connect `onBarcodeScanned` to a state check:
  ```typescript
  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
  ```
  Inside `handleBarcodeScanned`, set `scanned` state to `true` and process raw barcode data with `sanitizeAlphanumeric(result.data, 9)` to remove control bytes and cap at 9 characters. Render a "Rescan" button overlay on top of the viewfinder when `scanned` is active.

## Testing Decisions
* **Manual Verification**: Launch the camera, approve permission request, scan target QR code or Data Matrix label, verify scan details appear instantly without control character artifacts, and check that the camera feed ignores further scans until the state is reset.

## Out of Scope
* Integration with OAuth sign-in state or drive storage services.

## Further Notes
* Requires adding camera permission configuration to `app.json`.
