# Specification: Camera QR Scanner View (Battery Serial No.)

## Problem Statement
Users need a fast, low-friction mechanism to capture physical QR codes containing the Battery Serial No. using the phone's native camera sensor without manual configuration. In challenging physical conditions (e.g. small QR codes, distant placement, or poor lighting), an embedded preview card can be difficult to align. Additionally, users require zoom controls and full-screen camera framing to scan accurately, while ensuring captured Battery Serial No. payloads remain format-compliant (restricted to a maximum of 9 characters).

## Solution
Utilize `expo-camera` with the unified `CameraView` component in both inline card and expandable full-screen camera interfaces. Provide dynamic zoom controls (`zoom` property from `0` to `1` with tap-to-zoom presets like 1x, 2x, 3x, 5x) and torch toggle support. Implement scanning callbacks that automatically lock capture after a successful read to avoid repeated triggers, truncating/capping any scanned payload to a maximum of 9 characters.

## User Stories
1. As a mobile operator, I want to grant camera access to the app so that I can scan physical QR codes.
2. As a mobile operator, I want a styled camera viewfinder overlay with target guides so that I can easily align the camera with the QR code.
3. As a mobile operator, I want an option to expand the camera into a full-screen scanner view so that I can see a larger preview when scanning in difficult environments.
4. As a mobile operator, I want on-screen zoom control buttons (such as 1x, 2x, 3x, 5x) so that I can quickly zoom in on small or distant QR codes without moving the phone closer.
5. As a mobile operator, I want a torch/flashlight toggle in the camera interface so that I can illuminate dark environments when scanning.
6. As a mobile operator, I want the scanner to immediately parse the QR code string upon detection so that I experience zero scanning latency.
7. As a mobile operator, I want the scanner to pause and lock its state upon a successful scan so that the same code is not scanned repeatedly.
8. As a mobile operator, I want the captured Battery Serial No. payload to be capped at 9 characters so that the serial format remains compliant.
9. As a mobile operator, I want to see the captured scan details and have an easy option to rescan so that I can re-capture if the wrong QR code was scanned.

## Implementation Decisions
* **Library & Platform APIs**: `expo-camera` (using the modern `CameraView` component with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`).
* **Permissions Flow**: Use `useCameraPermissions()` hook to check and prompt for camera authorization, rendering permission request buttons when ungranted.
* **Inline Card & Full-Screen Modal Modes**:
  * **Inline Mode**: A compact preview card embedded in the main form flow.
  * **Full-Screen Mode**: A full-screen modal layer (`StyleSheet.absoluteFillObject`) rendering a full-bleed camera feed, viewfinder overlay, target alignment guides, and top/bottom floating control bars.
* **Zoom Control State**:
  * Control camera zoom via the `zoom` prop on `CameraView`, where `zoom` is a `number` between `0` (1x, standard field of view) and `1` (100% max hardware zoom).
  * Provide quick-select zoom preset pills (`1x`: `0.0`, `2x`: `0.15`, `3x`: `0.30`, `5x`: `0.50`) along with optional manual zoom increment controls.
* **Flashlight / Torch Integration**: Toggle `enableTorch` boolean state on `<CameraView enableTorch={torchEnabled} />`.
* **Scan Lock & Payload Truncation**:
  * Connect `onBarcodeScanned` to scan state check: `scanned ? undefined : handleBarcodeScanned`.
  * Inside `handleBarcodeScanned`, lock scanning state, truncate payload string to 9 characters (`data.slice(0, 9)`), trigger vibration/feedback, and close full-screen mode if active.
  * Provide a "Rescan" action to clear scan lock state and reset zoom to default.

## Testing Decisions
* **Good Test Principles**: Focus on external component behavior (rendering permission requests, responding to zoom changes, invoking scan callbacks with 9-char max string payload, locking scan state upon detection, and toggling full-screen mode) rather than internal camera engine implementation details.
* **Modules Tested**: Camera scanner component, full-screen scanner modal, zoom preset controls, permission state handlers.
* **Prior Art**: Existing component unit tests in the test directory using mock implementations of `expo-camera`.

## Out of Scope
* Pinch-to-zoom custom gesture handling using native gesture handler (zoom presets and stepper buttons fulfill zoom requirements cleanly).
* Integration with OAuth sign-in state or Drive storage services.
* Continuous batch QR code scanning (single-scan lock flow is maintained).

## Further Notes
* Ensure camera permissions are properly defined in `app.json` under `plugins: ["expo-camera", ...]`.

