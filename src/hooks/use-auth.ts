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
      // Ensure Google Play Services are available (Android specific check, safe on iOS)
      await GoogleOneTapSignIn.checkPlayServices();

      // 1. Try to sign in silently or with saved credentials
      let response = await GoogleOneTapSignIn.signIn();

      // 2. If no saved credentials found, attempt to prompt to create account
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }

      // 3. If still no credential, show explicit Google Sign-In prompt
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
      }

      // 4. Handle success response
      if (isSuccessResponse(response)) {
        const { user: googleUser, idToken: token } = response.data;
        setUser({
          name: googleUser.name ?? null,
          photo: googleUser.photo ?? null,
          email: googleUser.email ?? '',
        });
        setIdToken(token ?? null);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
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
