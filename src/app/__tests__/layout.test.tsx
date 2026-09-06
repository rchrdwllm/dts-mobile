/* eslint-disable import/first, @typescript-eslint/no-require-imports */
import React from 'react';
import { act, create } from 'react-test-renderer';

jest.mock('expo-router', () => {
  const ReactMock = require('react');
  const { View } = require('react-native');
  const Stack = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactMock.createElement(View, { testID: 'native-stack', ...props }, children);
  Stack.displayName = 'Stack';
  const StackScreen = (props: Record<string, unknown>) =>
    ReactMock.createElement(View, { testID: 'native-stack-screen', ...props });
  StackScreen.displayName = 'StackScreen';
  Stack.Screen = StackScreen;
  return {
    DarkTheme: {},
    DefaultTheme: {},
    Stack,
    ThemeProvider: ({ children }: React.PropsWithChildren) => children,
  };
});

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn() }));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: function GestureHandlerRootView({ children }: { children: React.ReactNode }) {
    const ReactMock = require('react');
    return ReactMock.createElement(ReactMock.Fragment, null, children);
  },
}));

import RootLayout from '../_layout';

describe('RootLayout', () => {
  it('uses the native header and configures the home screen for platform-native scroll behavior', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<RootLayout />);
    });

    expect(tree.root.findByProps({ testID: 'native-stack' }).props.screenOptions).toEqual({ headerShown: true });
    expect(tree.root.findByProps({ testID: 'native-stack-screen' }).props).toMatchObject({
      name: 'index',
      options: {
        title: 'Battery scan',
        headerLargeTitleEnabled: true,
        headerTransparent: true,
        scrollEdgeEffects: { top: 'automatic' },
      },
    });
  });
});
