import React from 'react';
import { create, act } from 'react-test-renderer';
import HomeScreen from '../index';
import { useAuth } from '@/hooks/use-auth';

jest.mock('expo-router', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    Stack: {
      Screen: ({ options }: { options?: { headerRight?: () => React.ReactNode } }) =>
        ReactMock.createElement(
          View,
          { testID: 'native-header-configuration', options },
          options?.headerRight?.(),
        ),
    },
  };
});

jest.mock('react-native-reanimated', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const builder = {
    duration: () => builder,
    easing: () => builder,
    reduceMotion: () => builder,
  };
  return {
    __esModule: true,
    default: { View },
    Easing: { bezier: jest.fn() },
    FadeInDown: builder,
    FadeOutLeft: builder,
    LinearTransition: builder,
    ReduceMotion: { System: 'system' },
    useReducedMotion: () => false,
  };
});

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

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => ReactMock.createElement(View, props, children),
    SwipeDirection: { RIGHT: 'right' },
  };
});

jest.mock('@/components/camera-scanner-card', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    CameraScannerCard: (props: any) => ReactMock.createElement(View, { testID: 'camera-scanner-card', ...props }),
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
    const buttonTexts = tree.root.findAllByProps({ children: 'Continue with Google' });
    expect(buttonTexts.length).toBeGreaterThan(0);
  });

  it('opens account controls and signs out when authenticated', async () => {
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
    expect(tree.root.findByProps({ accessibilityLabel: 'Scan battery QR code' })).toBeTruthy();

    const accountButton = tree.root.findByProps({ accessibilityLabel: 'Open account details' });
    act(() => {
      accountButton.props.onPress();
    });

    const signOutButton = tree.root.findByProps({ accessibilityLabel: 'Sign out of Google Account' });
    expect(signOutButton).toBeTruthy();

    await act(async () => {
      signOutButton.props.onPress();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows the Google profile photo in the header when one is available', () => {
    const photo = 'https://example.com/photo.jpg';
    mockUseAuth.mockReturnValue({
      user: { name: 'John Doe', photo, email: 'john@example.com' },
      idToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<HomeScreen />);
    });

    expect(tree.root.findByProps({ testID: 'header-profile-photo' }).props.source).toEqual({ uri: photo });
  });

  it('presents scan battery as the next action before a battery has been captured', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'John Doe', photo: null, email: 'john@example.com' },
      idToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<HomeScreen />);
    });

    expect(tree.root.findByProps({ accessibilityLabel: 'Scan battery QR code' })).toBeTruthy();
    expect(tree.root.findAllByProps({ children: 'Save to Google Drive' })).toHaveLength(0);
  });

  it('queues each scanned drone and battery pair so another pair can be captured before saving', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'John Doe', photo: null, email: 'john@example.com' },
      idToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<HomeScreen />);
    });

    act(() => {
      tree.root.findByProps({ accessibilityLabel: 'Drone serial number input' }).props.onChangeText('R12024007');
      tree.root.findByProps({ accessibilityLabel: 'Scan battery QR code' }).props.onPress();
      tree.root.findByProps({ testID: 'camera-scanner-card' }).props.onScan('GE0588607');
    });

    expect(tree.root.findByProps({ children: '1 scan ready' })).toBeTruthy();
    expect(tree.root.findByProps({ accessibilityLabel: 'Scan battery QR code' })).toBeTruthy();
    expect(tree.root.findByProps({ children: 'Save to Google Drive' })).toBeTruthy();
  });

  it('keeps queued scans but disables Drive saving in iOS mode', () => {
    const originalIosMode = process.env.EXPO_PUBLIC_IOS_MODE;
    process.env.EXPO_PUBLIC_IOS_MODE = 'true';
    mockUseAuth.mockReturnValue({
      user: { name: 'iOS Test User', photo: null, email: 'ios-test@example.invalid' },
      idToken: null,
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
    });

    try {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(<HomeScreen />);
      });

      act(() => {
        tree.root.findByProps({ accessibilityLabel: 'Drone serial number input' }).props.onChangeText('R12024007');
        tree.root.findByProps({ accessibilityLabel: 'Scan battery QR code' }).props.onPress();
        tree.root.findByProps({ testID: 'camera-scanner-card' }).props.onScan('GE0588607');
      });

      expect(tree.root.findByProps({ children: '1 scan ready' })).toBeTruthy();
      expect(tree.root.findByProps({ children: 'Google Drive unavailable in iOS mode' })).toBeTruthy();
      expect(tree.root.findByProps({ accessibilityLabel: 'Google Drive unavailable in iOS mode' }).props.disabled).toBe(true);

      act(() => {
        tree.root.findByProps({ accessibilityLabel: 'Open account details' }).props.onPress();
      });
      expect(() => tree.root.findByProps({ accessibilityLabel: 'Sign out of Google Account' })).toThrow();
    } finally {
      process.env.EXPO_PUBLIC_IOS_MODE = originalIosMode;
    }
  });
});
