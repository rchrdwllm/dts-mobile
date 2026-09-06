import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

type AnimatedPressableProps = Omit<PressableProps, 'children'> & { children: ReactNode };

export function AnimatedPressable({ children, onPressIn, onPressOut, ...props }: AnimatedPressableProps) {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      {...props}
      hitSlop={props.hitSlop ?? 8}
      pressRetentionOffset={props.pressRetentionOffset ?? 16}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}>
      <Animated.View style={[styles.content, pressed && styles.pressed, reducedMotion && styles.reducedMotion]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionDuration: '120ms',
    transitionTimingFunction: 'ease-out',
  },
  pressed: { transform: [{ scale: 0.97 }] },
  reducedMotion: { transitionDuration: '0ms' },
});
