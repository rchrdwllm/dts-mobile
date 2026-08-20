import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sanitizeAlphanumeric } from '@/utils/sanitize';

export type ReferenceInputCardProps = {
  value: string;
  onChangeText: (sanitizedText: string) => void;
  label?: string;
  placeholder?: string;
};

export function ReferenceInputCard({
  value,
  onChangeText,
  label = 'Reference Code',
  placeholder = 'Enter Reference Number...',
}: ReferenceInputCardProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text: string) => {
    const sanitized = sanitizeAlphanumeric(text);
    onChangeText(sanitized);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.badgeText}>
          Alphanumeric Only
        </ThemedText>
      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.background,
            borderColor: isFocused ? '#007AFF' : theme.backgroundSelected,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType="default"
          autoCapitalize="characters"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel="Alphanumeric reference input"
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  input: {
    fontSize: 16,
    padding: 0,
    fontWeight: '500',
  },
});
