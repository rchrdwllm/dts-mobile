import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { serializeScanRecord } from '@/utils/xml';

export type ScanPreviewCardProps = {
  inputNumber: string;
  qrCodeData?: string;
  timestamp?: string;
  title?: string;
};

const DEFAULT_MOCK_QR = 'SAMPLE-QR-987654321';

export function ScanPreviewCard({
  inputNumber,
  qrCodeData = DEFAULT_MOCK_QR,
  timestamp,
  title = 'XML Scan Preview',
}: ScanPreviewCardProps) {
  const theme = useTheme();

  const xmlContent = serializeScanRecord({
    inputNumber: inputNumber || '(None)',
    qrCodeData,
    timestamp,
  });

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.badgeText}>
          Live XML Output
        </ThemedText>
      </View>

      <View
        style={[
          styles.codeContainer,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedText type="code" style={styles.codeText}>
            {xmlContent}
          </ThemedText>
        </ScrollView>
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
  codeContainer: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  codeText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
