# Specification: Auth Persistence & Session Hydration

## Problem Statement

Currently, when a user signs in with Google and closes the app, their authentication state is lost upon reopening the app from their phone. The app resets to an unauthenticated state, forcing the user to sign in again every time the application is launched.

## Solution

Persist authentication state across application launches until the user explicitly signs out. On cold start, the application will asynchronously check for an existing active Google session via `GoogleOneTapSignIn.getCurrentUser()`. If a session exists, the user profile is hydrated automatically and the user accesses the main application immediately without screen flickering or manual login prompts.

## User Stories

1. As a mobile operator, I want my Google authentication session to remain active after closing and reopening the app, so that I do not need to log in again every time I launch the app.
2. As a mobile operator, I want to see a seamless splash or loading screen while the app restores my session on launch, so that I do not experience visual screen flickering or brief exposure of the login UI.
3. As a mobile operator, I want my profile details (name, email, profile photo) restored automatically on startup, so that the header immediately reflects my active account identity.
4. As a mobile operator, I want to stay authenticated until I manually tap the Sign Out button, so that my workflow remains uninterrupted over multiple sessions.
5. As a mobile operator, I want background token refresh to handle expired credentials during Google Drive uploads, so that transient token expiration does not disrupt my file saving.
6. As a mobile operator, I want to be redirected cleanly to the Sign In screen if my session is explicitly revoked or invalid beyond recovery, so that the application maintains security.

## Implementation Decisions

- **Session Check on Mount**:
  - The authentication custom hook will execute a session restoration check during initialization.
  - It will query the native Google Sign-In SDK for any active saved session (`getCurrentUser()`).
  - If a valid session is returned, user profile information (name, email, photo) and ID token are hydrated into application state, marking authentication as active.
  - If no session exists (`null`), authentication state defaults to unauthenticated.

- **Hydration Loading State**:
  - Introduce an explicit loading state (`isLoading` or `isCheckingAuth`) during session resolution on cold start.
  - While loading is active, the root application view renders a neutral splash/loading indicator to prevent brief flashing of the Sign-In UI before session state is established.

- **Token Refresh & Expiration Handling**:
  - When background operations (such as Google Drive XML uploads) encounter access token expiration or `SIGN_IN_REQUIRED` errors, the system attempts automatic token retrieval and cache invalidation before failing.
  - If token retrieval succeeds, the operation retries automatically.
  - If token retrieval fails due to revoked credentials, authentication state is cleared and the user is navigated to the Sign-In interface.

- **Sign-Out Execution**:
  - Explicit sign-out clears both local application state and native Google Sign-In SDK session data (`signOut()`), requiring manual re-authentication on next app launch.

## Testing Decisions

- **Testing Seam**:
  - Primary testing seam is at the custom hook level (`useAuth`).
  - Mock the native Google Sign-In SDK response for `getCurrentUser()`, `signIn()`, and `signOut()`.

- **Test Cases**:
  - Verify initial state starts in loading state while checking native session.
  - Verify stored session automatically hydrates user state and sets authenticated to true when `getCurrentUser()` returns valid user data.
  - Verify state resolves to unauthenticated when `getCurrentUser()` returns `null`.
  - Verify transition from loading state to ready state once session check completes.
  - Verify sign-out clears user state and invokes native sign-out.

- **Prior Art**:
  - Existing hook tests in `src/hooks/__tests__/use-auth.test.ts`.

## Out of Scope

- Storing user credentials or tokens in custom local storage (relying strictly on native SDK session storage).
- Offline queued upload retry queues (handled separately by sync module).

## Further Notes

- Respects architectural decisions outlined in ADR 0001 (Architecture, XML Schema & Google Drive Storage Strategy) and vocabulary defined in the Domain Glossary.
