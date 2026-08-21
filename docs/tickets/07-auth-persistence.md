# 07 — Auth Persistence & Session Hydration

**What to build:**
Persist Google authentication state across app restarts so that when a signed-in user closes and reopens the app on their phone, they remain signed in without needing to log in again. On app mount, check for an existing active Google session via `GoogleOneTapSignIn.getCurrentUser()`. While checking session state on cold start, render a smooth splash/loading screen to prevent screen flickering or brief flashing of the Sign-In UI. Automatically handle background token retrieval/refresh if Google Drive uploads encounter token expiration, falling back to sign-out only if token recovery fails.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] On app launch, `useAuth` hook automatically checks `GoogleOneTapSignIn.getCurrentUser()` to restore active session state.
- [x] If an active native user session exists, `user`, `idToken`, and `isAuthenticated` states are populated automatically without user interaction.
- [x] Render a splash/loading indicator during initial session resolution to prevent UI flickering between signed-out and signed-in states.
- [x] If no active native session exists (`null`), state resolves cleanly to unauthenticated mode.
- [x] Tapping "Sign Out" invokes `GoogleOneTapSignIn.signOut()` and clears stored state, ensuring subsequent app launches start in unauthenticated mode.
- [x] Google Drive upload operations attempt background token retrieval (`getTokens()`) and token cache invalidation on 401 or auth errors before prompting for sign-in.
- [x] Update `useAuth` hook unit tests and UI tests to verify cold-start hydration, loading state, and session teardown.
