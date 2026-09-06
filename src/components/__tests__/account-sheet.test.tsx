import React from 'react';
import { act, create } from 'react-test-renderer';

import { AccountSheet } from '../account-sheet';

jest.mock('@expo/ui/community/bottom-sheet', () => ({
  BottomSheet: ({ children, ...props }: any) => {
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    const { View: NativeView } = require('react-native');
    return <NativeView testID="native-account-sheet" {...props}>{children}</NativeView>;
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#ffffff',
    backgroundElement: '#f5f5f5',
    backgroundSelected: '#e5e5e5',
  }),
}));

jest.mock('@/components/animated-pressable', () => ({
  AnimatedPressable: ({ children, ...props }: any) => {
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    const { Pressable: NativePressable } = require('react-native');
    return <NativePressable {...props}>{children}</NativePressable>;
  },
}));

describe('AccountSheet', () => {
  it('delegates presentation and dismissal to the native bottom sheet', () => {
    const onDismiss = jest.fn();

    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AccountSheet
          visible
          user={{ name: 'John Doe', email: 'john@example.com', photo: null }}
          loading={false}
          isIosMode={false}
          onDismiss={onDismiss}
          onSignOut={jest.fn()}
        />
      );
    });

    const sheet = tree.root.findByProps({ testID: 'native-account-sheet' });
    expect(sheet.props.index).toBe(0);

    act(() => {
      sheet.props.onDismiss();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
