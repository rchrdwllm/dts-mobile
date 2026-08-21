# ADR 0001: Architecture, XML Schema & Google Drive Storage Strategy

* **Status:** Under Review
* **Date:** 2026-08-16
* **Deciders:** Developer, Agent

## Context and Problem Statement
The app needs to capture user numeric input and scanned QR codes, present the result on screen with a timestamp, and format & save the data as an XML document stored in Google Drive.

## Decisions Made
1. **Google Drive Storage Strategy**: Each scan will create a **new individual XML file** (Option A schema) inside a dedicated `QRScannerGDrive` folder in the user's Google Drive. If the folder does not exist, the app will create it automatically.
2. **Authentication Flow & Persistence**: User OAuth 2.0 is required. The app uses native Google Sign-In via `react-native-nitro-google-signin` configured with the `https://www.googleapis.com/auth/drive.file` scope. Auth state is persisted across app restarts by checking `GoogleOneTapSignIn.getCurrentUser()` synchronously on app mount. The app remains authenticated until explicit sign-out.
3. **Client Configuration**: Google Sign-In is configured via the `"react-native-nitro-google-signin"` Expo config plugin and service credential files (`google-services.json` and `GoogleService-Info.plist`) in the project root with `webClientId: 'autoDetect'` configuration.
4. **XML Schema**: Option A format:
   ```xml
   <ScanRecord>
     <InputNumber>[number]</InputNumber>
     <QRCodeData>[scanned data]</QRCodeData>
     <Timestamp>[ISO 8601 Date]</Timestamp>
   </ScanRecord>
   ```
5. **QR Scanner Module**: `expo-camera` with native barcode scanner support on a single-screen layout.
6. **Offline & Sync**: No local sync queue; scans will fail and notify the user immediately if there is a network issue, auth expiration, or Google Drive upload error.
7. **Session Lifecycle & Recovery**: While restoring auth state on cold start, the app renders a smooth splash/loading screen to prevent screen flicker. If Google Drive uploads encounter token expiration or auth errors (401 / `SIGN_IN_REQUIRED`), the app attempts background token retrieval (`getTokens`) / refresh before prompting for re-authentication.



