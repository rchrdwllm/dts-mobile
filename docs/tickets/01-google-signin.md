# 01 — Native Google Sign-In Integration

**What to build:**
Integrate `react-native-nitro-google-signin` to authenticate users and fetch OAuth tokens with OAuth scopes restricted to `https://www.googleapis.com/auth/drive.file`. Configure Google Sign-In with Android Credential Manager support and the config plugin in `app.json`. Build a header bar that displays the signed-in profile picture and full name, and provides "Sign In" / "Sign Out" actions.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Install `react-native-nitro-google-signin` and its peer dependency `react-native-nitro-modules` via `npx expo install`.
- [ ] Add the `"react-native-nitro-google-signin"` plugin to the `plugins` array in `app.json`.
- [ ] Configure `android.googleServicesFile` and `ios.googleServicesFile` in `app.json`.
- [ ] Initialize `GoogleOneTapSignIn` using `GoogleOneTapSignIn.configure({ webClientId: 'autoDetect', scopes: ['https://www.googleapis.com/auth/drive.file'] })`.
- [ ] Header displays "Sign In" button when unauthenticated, launching the native Google One Tap / Credential Manager sign-in flow.
- [ ] Upon successful authentication, display the user's name and profile avatar in the header with a "Sign Out" button.
- [ ] Tapping "Sign Out" calls `GoogleOneTapSignIn.signOut()` to clear local session and auth state.
