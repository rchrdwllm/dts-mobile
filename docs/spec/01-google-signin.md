# Specification: Native Google Sign-In Integration

## Problem Statement
The app must upload XML records to Google Drive on behalf of the user. To comply with modern security and UX guidelines, it must request authentication using a secure native Google Sign-In interface (supporting Android Credential Manager) without exposing credentials to the app codebase.

## Solution
Integrate a native Google Sign-in flow via `react-native-nitro-google-signin`. Configure OAuth scopes strictly to `https://www.googleapis.com/auth/drive.file` so the app can only read and write files it creates. 

Use a development build with the custom native config plugin. The login utilizes Android Credential Manager on Android, and the Google Sign-In SDK on iOS.

## User Stories
1. As a mobile operator, I want to authenticate with my Google Account in the app header so that I can authorize file uploads to my Google Drive storage.
2. As a mobile operator, I want to see my Google avatar and name once authenticated so that I know exactly which account is active.
3. As a mobile operator, I want to sign out of my Google account using a button in the header so that I can swap accounts or secure the device.

## Implementation Decisions
* **Libraries**: `react-native-nitro-google-signin` (and `react-native-nitro-modules`).
* **Configuration**:
  * Set the custom native config plugin `"react-native-nitro-google-signin"` in `app.json`.
  * Place `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in the project root and reference them under `android.googleServicesFile` and `ios.googleServicesFile` in `app.json`.
  * Initialize the Google Sign-in helper:
    ```typescript
    GoogleOneTapSignIn.configure({
      webClientId: 'autoDetect',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    ```
* **Authentication Flow**:
  * Check Play Services availability on Android: `GoogleOneTapSignIn.checkPlayServices()`.
  * Trigger sign-in using `GoogleOneTapSignIn.signIn()` with fallbacks to `createAccount()` and `presentExplicitSignIn()`.
  * Retrieve name, profile picture avatar, and email from the response data on successful sign-in.
* **Header UI**: Render a stylized panel containing:
  * Signed-in status.
  * Profile picture (using `expo-image` for caching) and User Name.
  * Stylized "Sign In" and "Sign Out" buttons.

## Testing Decisions
* **Verification**: Verify configuration files and plugins are correctly defined in `app.json`.
* **Manual Verification**: Since this uses native code, build a development build (locally via `npx expo run:android` / `run:ios` or via `eas build`). Verify that clicking "Sign In" launches the native One Tap consent sheet or Credential Manager dialog, prompts for credentials, and successfully returns the user details.

## Out of Scope
* Direct integration with the Google Drive file API (this just resolves the login identity and token/session).

## Further Notes
* Because this library contains custom native modules, it cannot be run in Expo Go. A development build must be generated to test this authentication layer.
