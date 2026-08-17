import React from 'react';
import { create, act } from 'react-test-renderer';
import { useAuth } from '../use-auth';
import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';

// Mock component to capture hook values on render
interface TestComponentProps {
  onRender: (auth: ReturnType<typeof useAuth>) => void;
}

function TestComponent({ onRender }: TestComponentProps) {
  const auth = useAuth();
  onRender(auth);
  return null;
}

// Mock react-native-nitro-google-signin native module
jest.mock('react-native-nitro-google-signin', () => {
  return {
    GoogleOneTapSignIn: {
      configure: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      checkPlayServices: jest.fn(),
      createAccount: jest.fn(),
      presentExplicitSignIn: jest.fn(),
    },
    isNoSavedCredentialFoundResponse: jest.fn((res) => res?.type === 'noSavedCredentialFound'),
    isSuccessResponse: jest.fn((res) => res?.type === 'success'),
  };
}, { virtual: true });

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default unauthenticated state and configure GoogleOneTapSignIn', () => {
    let hookValues!: ReturnType<typeof useAuth>;

    act(() => {
      create(
        React.createElement(TestComponent, {
          onRender: (val) => {
            hookValues = val;
          },
        })
      );
    });

    expect(hookValues.user).toBeNull();
    expect(hookValues.idToken).toBeNull();
    expect(hookValues.isAuthenticated).toBe(false);
    expect(GoogleOneTapSignIn.configure).toHaveBeenCalledWith({
      webClientId: 'autoDetect',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  });

  it('should sign in successfully and update authenticated state', async () => {
    const mockSuccessResponse = {
      type: 'success',
      data: {
        user: { name: 'John Doe', photo: 'https://avatar.png', email: 'john@example.com' },
        idToken: 'mock-id-token',
      },
    };

    (GoogleOneTapSignIn.signIn as jest.Mock).mockResolvedValue(mockSuccessResponse);
    (GoogleOneTapSignIn.checkPlayServices as jest.Mock).mockResolvedValue(true);

    let hookValues!: ReturnType<typeof useAuth>;

    act(() => {
      create(
        React.createElement(TestComponent, {
          onRender: (val) => {
            hookValues = val;
          },
        })
      );
    });

    await act(async () => {
      await hookValues.signIn();
    });

    expect(GoogleOneTapSignIn.checkPlayServices).toHaveBeenCalled();
    expect(GoogleOneTapSignIn.signIn).toHaveBeenCalled();
    expect(hookValues.user).toEqual(mockSuccessResponse.data.user);
    expect(hookValues.idToken).toBe('mock-id-token');
    expect(hookValues.isAuthenticated).toBe(true);
  });

  it('should sign out successfully and clear authenticated state', async () => {
    (GoogleOneTapSignIn.signOut as jest.Mock).mockResolvedValue(undefined);

    let hookValues!: ReturnType<typeof useAuth>;

    act(() => {
      create(
        React.createElement(TestComponent, {
          onRender: (val) => {
            hookValues = val;
          },
        })
      );
    });

    // Call sign out
    await act(async () => {
      await hookValues.signOut();
    });

    expect(GoogleOneTapSignIn.signOut).toHaveBeenCalled();
    expect(hookValues.user).toBeNull();
    expect(hookValues.idToken).toBeNull();
    expect(hookValues.isAuthenticated).toBe(false);
  });

  it('should use EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID when set', () => {
    const originalEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';

    try {
      act(() => {
        create(
          React.createElement(TestComponent, {
            onRender: () => {},
          })
        );
      });

      expect(GoogleOneTapSignIn.configure).toHaveBeenCalledWith({
        webClientId: 'test-web-client-id',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    } finally {
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = originalEnv;
    }
  });
});
