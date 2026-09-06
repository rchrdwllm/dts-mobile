import type * as GoogleSignIn from 'react-native-nitro-google-signin';

type GoogleSignInModule = typeof GoogleSignIn;
type OneTapResponse = Awaited<ReturnType<GoogleSignInModule['GoogleOneTapSignIn']['presentExplicitSignIn']>>;
type SuccessfulOneTapResponse = OneTapResponse & {
  type: 'success';
  data: NonNullable<OneTapResponse['data']>;
};

let googleSignInModule: GoogleSignInModule | null = null;

function getGoogleSignInModule(): GoogleSignInModule {
  if (!googleSignInModule) {
    // This is intentionally lazy: iOS test mode must not initialize the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleSignInModule = require('react-native-nitro-google-signin') as GoogleSignInModule;
  }

  return googleSignInModule;
}

export function getGoogleOneTapSignIn() {
  return getGoogleSignInModule().GoogleOneTapSignIn;
}

export function isGoogleSignInSuccessResponse(response: OneTapResponse): response is SuccessfulOneTapResponse {
  return getGoogleSignInModule().isSuccessResponse(response);
}
