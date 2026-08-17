# Specification: Camera QR Scanner View

## Problem Statement
Users need a fast, low-friction mechanism to capture physical QR codes using the phone's native camera sensor without manual configuration.

## Solution
Use `expo-camera` with the unified `CameraView` component. Apply stylized boundaries on the scanner layout and implement scanning callbacks that automatically pause capture after a successful read to avoid multiple triggers.

## User Stories
1. As a mobile operator, I want to grant camera access to the app so that I can scan physical QR codes.
2. As a mobile operator, I want a styled camera viewfinder overlay with scanning target guides so that I can easily align the camera to the QR code.
3. As a mobile operator, I want the scanner to immediately parse the QR code string upon detection so that I do not experience scanning delays.
4. As a mobile operator, I want the scanner to pause and lock its state upon success so that the same code is not scanned repeatedly.
5. As a mobile operator, I want to see the captured scan details (Number, QR payload, and date/time) in a preview card so that I can verify the data.

## Implementation Decisions
* **Library**: `expo-camera` (using the modern `CameraView` component).
* **Permissions Flow**: Use the `useCameraPermissions()` hook to check and prompt for camera authorization. Render a clean fallback button if permission is denied.
* **Viewport Overlay**: Draw an overlay over the `CameraView` depicting a scanning square target indicator.
* **Scan Lock**: Connect `onBarcodeScanned` to a state check:
  ```typescript
  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
  ```
  Inside `handleBarcodeScanned`, set `scanned` state to `true` and save the string data. Render a "Rescan" button overlay on top of the viewfinder when `scanned` is active.

## Testing Decisions
* **Manual Verification**: Launch the camera, approve permission request, scan target QR code, verify scan details appear instantly, and check that the camera feed ignores further scans until the state is reset.

## Out of Scope
* Integration with OAuth sign-in state or drive storage services.

## Further Notes
* Requires adding camera permission configuration to `app.json`.
