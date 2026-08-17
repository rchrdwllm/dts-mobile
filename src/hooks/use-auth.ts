import { useState, useEffect } from 'react';
import { 
  GoogleOneTapSignIn, 
  isNoSavedCredentialFoundResponse, 
  isSuccessResponse 
} from 'react-native-nitro-google-signin';

export interface GoogleUser {
  name: string | null;
  photo: string | null;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Configure native Google One Tap Sign-In on mount
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'autoDetect';
    GoogleOneTapSignIn.configure({
      webClientId: clientId,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }, []);

  const signIn = async () => {
    try {
      console.log('[DEBUG] 1. Checking play services...');
      await GoogleOneTapSignIn.checkPlayServices();

      console.log('[DEBUG] 2. Calling GoogleOneTapSignIn.signIn()...');
      let response = await GoogleOneTapSignIn.signIn();
      console.log('[DEBUG] signIn() response:', JSON.stringify(response));

      if (isNoSavedCredentialFoundResponse(response)) {
        console.log('[DEBUG] 3. No saved credentials. Calling createAccount()...');
        response = await GoogleOneTapSignIn.createAccount();
        console.log('[DEBUG] createAccount() response:', JSON.stringify(response));
      }

      if (isNoSavedCredentialFoundResponse(response)) {
        console.log('[DEBUG] 4. Still no credentials. Calling presentExplicitSignIn()...');
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
        console.log('[DEBUG] presentExplicitSignIn() response:', JSON.stringify(response));
      }

      console.log('[DEBUG] 5. Final response type:', response.type);
      if (isSuccessResponse(response)) {
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
    signIn,
    signOut,
  };
}
