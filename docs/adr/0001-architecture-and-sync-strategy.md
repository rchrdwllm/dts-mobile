# ADR 0001: Architecture, XML Schema & Google Drive Storage Strategy

* **Status:** Under Review
* **Date:** 2026-08-16
* **Deciders:** Developer, Agent

## Context and Problem Statement
The app needs to capture user numeric input and scanned QR codes, present the result on screen with a timestamp, and format & save the data as an XML document stored in Google Drive.

## Decisions Made
1. **Google Drive Storage Strategy**: Each scan will create a **new individual XML file** (Option A schema) inside a dedicated `QRScannerGDrive` folder in the user's Google Drive. If the folder does not exist, the app will create it automatically.
2. **Authentication Flow**: User OAuth 2.0 is required. The app will use native Google Sign-In via `react-native-nitro-google-signin` (utilizing Android Credential Manager and native iOS/Android SDKs) configured with the `https://www.googleapis.com/auth/drive.file` scope.
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


