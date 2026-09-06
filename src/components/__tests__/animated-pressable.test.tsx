import React from 'react';
import { act, create } from 'react-test-renderer';

import { AnimatedPressable } from '../animated-pressable';

jest.mock('react-native-reanimated', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const ReactMock = require('react');
  const { StyleSheet, View } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const AnimatedView = ({ style, children }: { style: unknown; children: React.ReactNode }) => {
    const timingFunction = StyleSheet.flatten(style).transitionTimingFunction;
    const supported = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'];
    if (timingFunction && !supported.includes(timingFunction)) {
      throw new Error(`Unsupported timing function: ${timingFunction}`);
    }
    return ReactMock.createElement(View, null, children);
  };
  return { __esModule: true, default: { View: AnimatedView }, useReducedMotion: () => false };
});

describe('AnimatedPressable', () => {
  it('provides press feedback without changing the button action', () => {
    const onPress = jest.fn();
    let tree!: ReturnType<typeof create>;

    act(() => {
      tree = create(
        <AnimatedPressable accessibilityLabel="animated action" onPress={onPress}>
          Action
        </AnimatedPressable>
      );
    });

    const button = tree.root
      .findAllByProps({ accessibilityLabel: 'animated action' })
      .find((node) => typeof node.props.onPressIn === 'function');
    expect(button).toBeDefined();
    expect(button!.props.onPressIn).toBeDefined();
    expect(button!.props.onPressOut).toBeDefined();

    act(() => {
      button!.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
