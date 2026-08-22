# Domain Glossary

This document defines core domain concepts for the QR Scanner Google Drive App.

## Core Concepts

### Scan Record
A single captured dataset representing a user action, consisting of:
- **Battery Serial No.**: The raw string payload scanned from a QR code.
- **Drone Serial No.**: Alphanumeric value entered manually by the user (reference batch).
- **Timestamp**: The date and time when the scan/entry occurred (ISO 8601 standard).

### XML Serializer
The subsystem responsible for formatting one or more **Scan Records** into standard XML format.

### Google Drive Storage Provider
The component responsible for sending XML payloads to Google Drive. This uses `react-native-nitro-google-signin` to authenticate the user and write XML files to the `battery-scans` folder in their own Google Drive account.


### Scan Queue / Sync State
Not implemented. The app operates synchronously; if an upload fails, the user is notified immediately, and the scan state is reset or prompted for retry.

### Auth Persistence & Session Hydration
The mechanism where the app checks `GoogleOneTapSignIn.getCurrentUser()` on app launch (cold start) to automatically restore the user's Google authentication state without prompting for credentials, keeping the user signed in until explicit sign-out.


