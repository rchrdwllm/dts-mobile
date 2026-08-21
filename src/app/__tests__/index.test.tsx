import React from 'react';
import { create, act } from 'react-test-renderer';
import HomeScreen from '../index';
import { useAuth } from '@/hooks/use-auth';

jest.mock('react-native-nitro-google-signin', () => {
  return {
    GoogleOneTapSignIn: {
      configure: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      checkPlayServices: jest.fn(),
      createAccount: jest.fn(),
      presentExplicitSignIn: jest.fn(),
      getCurrentUser: jest.fn(),
      getTokens: jest.fn(),
      clearCachedAccessToken: jest.fn(),
    },
    isNoSavedCredentialFoundResponse: jest.fn((res) => res?.type === 'noSavedCredentialFound'),
    isSuccessResponse: jest.fn((res) => res?.type === 'success'),
  };
}, { virtual: true });

jest.mock('@/hooks/use-auth');
jest.mock('@/components/animated-icon', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    AnimatedIcon: () => ReactMock.createElement(View, { testID: 'mock-animated-icon' }),
  };
});

jest.mock('expo-camera', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    CameraView: (props: any) =>
      ReactMock.createElement(View, { testID: 'mock-camera-view', ...props }),
    useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  };
});

describe('HomeScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading splash container while isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      idToken: null,
      isAuthenticated: false,
      isLoading: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<HomeScreen />);
    });

    expect(tree.root.findByProps({ testID: 'auth-loading-indicator' })).toBeTruthy();
  });

  it('renders Sign In gate screen when unauthenticated and not loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      idToken: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<HomeScreen />);
    });

    expect(() => tree.root.findByProps({ testID: 'auth-loading-indicator' })).toThrow();
    const buttonTexts = tree.root.findAllByProps({ children: 'Sign In with Google' });
    expect(buttonTexts.length).toBeGreaterThan(0);
  });

  it('renders main application dashboard with Sign Out button when authenticated', async () => {
    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { name: 'John Doe', photo: 'https://example.com/photo.jpg', email: 'john@example.com' },
      idToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: mockSignOut,
    });

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<HomeScreen />);
    });

    expect(() => tree.root.findByProps({ testID: 'auth-loading-indicator' })).toThrow();
    const saveButtons = tree.root.findAllByProps({ accessibilityLabel: 'Save scan to Google Drive' });
    expect(saveButtons.length).toBeGreaterThan(0);

    const signOutButton = tree.root.findByProps({ accessibilityLabel: 'Sign out of Google Account' });
    expect(signOutButton).toBeTruthy();

    await act(async () => {
      signOutButton.props.onPress();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });
});
