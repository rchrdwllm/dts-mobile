# Specification: Native Google Sign-In Integration

## Problem Statement
The app must upload XML records to Google Drive on behalf of the user. To comply with modern security and UX guidelines, it must request authentication using a secure native Google Sign-In interface (supporting Android Credential Manager) without exposing credentials to the app codebase. Additionally, users must be able to sign out securely to switch accounts or clear authentication session state from the device.

## Solution
Integrate a native Google Sign-in and Sign-out flow via `react-native-nitro-google-signin`. Configure OAuth scopes strictly to `https://www.googleapis.com/auth/drive.file` so the app can only read and write files it creates. 

Use a development build with the custom native config plugin. The login utilizes Android Credential Manager on Android, and the Google Sign-In SDK on iOS. Sign-out invokes native SDK revocation/session removal and resets react app state.

## User Stories
1. As a mobile operator, I want to authenticate with my Google Account via a sign-in gate screen so that I can authorize file uploads to my Google Drive storage.
2. As a mobile operator, I want to see my connected Google Account details in the status panel at the bottom of the screen once authenticated.
3. As a mobile operator, I want to sign out of my Google account using a button in the bottom status container so that I can swap accounts, revoke active tokens, or secure the device.
4. As a mobile operator, I want visual feedback (loading state) while signing in or signing out so that I know the native operation is in progress.

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
  * **Sign-Out & Session Reset Flow**:
    * Trigger native sign-out via `GoogleOneTapSignIn.signOut()`.
    * Reset local authentication state in `useAuth` hook (`user` set to `null`, `idToken` set to `null`, `isAuthenticated` set to `false`).
    * Handle sign-out errors gracefully by alerting the user if the native call fails while resetting state appropriately.
* **Bottom Status Panel UI**: Render a stylized `<ThemedView type="backgroundElement">` card at the bottom of the screen containing:
  * "Account Connected" hint row showing user's email.
  * "Folder Destination" hint row (`/QRScannerGDrive`).
  * "Reference Batch" hint row showing current reference code.
  * Prominent "Sign Out" button at the bottom of the container with loading state while sign-out is processing.

## Testing Decisions
* **Verification**: Verify configuration files and plugins are correctly defined in `app.json`.
* **Unit Testing**: 
  * Mock `react-native-nitro-google-signin` native module in unit tests (`signIn`, `signOut`, `configure`, `getCurrentUser`).
  * Verify `useAuth` hook updates state properly on `signIn()` and `signOut()` invocations.
  * Update unit test suite for `HomeScreen` (`src/app/__tests__/index.test.tsx`) verifying "Sign Out" button renders in the bottom container when authenticated and calls `signOut()`.
* **Manual Verification**: Since this uses native code, build a development build (locally via `npx expo run:android` / `run:ios` or via `eas build`). Verify that clicking "Sign In" launches the native One Tap consent sheet or Credential Manager dialog, prompts for credentials, and successfully returns the user details. Verify that clicking "Sign Out" in the bottom container revokes/clears the active session and returns the UI to the unauthenticated gate state.

## Out of Scope
* Direct integration with the Google Drive file API (this just resolves the login identity and token/session).

## Further Notes
* Because this library contains custom native modules, it cannot be run in Expo Go. A development build must be generated to test this authentication layer.

