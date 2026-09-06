import { useEffect, useState } from 'react';
import { IOS_TEST_USER, isIosMode } from '@/config/ios-mode';
import { getGoogleOneTapSignIn, isGoogleSignInSuccessResponse } from '@/utils/google-signin';

export interface GoogleUser {
  name: string | null;
  photo: string | null;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(() => isIosMode() ? IOS_TEST_USER : null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isIosMode());
  const [isLoading, setIsLoading] = useState<boolean>(() => !isIosMode());

  useEffect(() => {
    let isMounted = true;

    if (isIosMode()) {
      return () => {
        isMounted = false;
      };
    }

    const GoogleOneTapSignIn = getGoogleOneTapSignIn();

    // Configure native Google One Tap Sign-In on mount
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'autoDetect';
    GoogleOneTapSignIn.configure({
      webClientId: clientId,
      scopes: [
        'https://www.googleapis.com/auth/drive',
      ],
    });

    const checkSession = async () => {
      try {
        const currentUser = GoogleOneTapSignIn.getCurrentUser();
        if (isMounted) {
          if (currentUser && currentUser.user) {
            setUser({
              name: currentUser.user.name ?? null,
              photo: currentUser.user.photo ?? null,
              email: currentUser.user.email ?? '',
            });
            setIdToken(currentUser.idToken ?? null);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIdToken(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.warn('[useAuth] Error checking current user session:', error);
        if (isMounted) {
          setUser(null);
          setIdToken(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async () => {
    if (isIosMode()) return;

    const GoogleOneTapSignIn = getGoogleOneTapSignIn();

    try {
      console.log('[DEBUG] 1. Checking play services...');
      await GoogleOneTapSignIn.checkPlayServices();

      console.log('[DEBUG] Calling GoogleOneTapSignIn.presentExplicitSignIn() directly...');
      const response = await GoogleOneTapSignIn.presentExplicitSignIn();
      console.log('[DEBUG] presentExplicitSignIn() response:', JSON.stringify(response));

      console.log('[DEBUG] 5. Final response type:', response?.type);
      if (response && isGoogleSignInSuccessResponse(response)) {
        console.log('[DEBUG] Sign-in succeeded. User data:', JSON.stringify(response.data.user));
        const { user: googleUser, idToken: token } = response.data;
        setUser({
          name: googleUser.name ?? null,
          photo: googleUser.photo ?? null,
          email: googleUser.email ?? '',
        });
        setIdToken(token ?? null);
        setIsAuthenticated(true);
      } else {
        console.warn('[DEBUG] Sign-in completed but was NOT success. Response payload:', JSON.stringify(response));
      }
    } catch (error) {
      console.error('[DEBUG] Google sign-in threw native exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (isIosMode()) return;

    const GoogleOneTapSignIn = getGoogleOneTapSignIn();

    try {
      await GoogleOneTapSignIn.signOut();
      setUser(null);
      setIdToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Google sign-out failed:', error);
      throw error;
    }
  };

  return {
    user,
    idToken,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  };
}
