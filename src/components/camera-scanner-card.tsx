import React from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { sanitizeAlphanumeric } from '@/utils/sanitize';

export type CameraScannerCardProps = {
  scanned: boolean;
  scannedValue?: string;
  onScan: (data: string) => void;
  onRescan: () => void;
  title?: string;
};

export function CameraScannerCard({
  scanned,
  scannedValue,
  onScan,
  onRescan,
  title = 'Battery Serial No.',
}: CameraScannerCardProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!scanned && result.data) {
      onScan(sanitizeAlphanumeric(result.data, 9));
    }
  };

  const renderContent = () => {
    if (!permission) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Loading camera permissions...
          </ThemedText>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.stateContainer}>
          <ThemedText type="default" style={styles.centerText}>
            Camera access is required to scan physical QR codes.
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: '#007AFF' },
              pressed && styles.buttonPressed,
            ]}
            onPress={requestPermission}
          >
            <ThemedText type="default" style={styles.actionButtonText}>
              Grant Camera Access
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraViewport}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'datamatrix'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        {/* Viewfinder Alignment Overlay */}
        {!scanned && (
          <View style={styles.overlayContainer}>
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <ThemedText type="small" style={styles.scanInstruction}>
              Align QR Code in target box
            </ThemedText>
          </View>
        )}

        {/* Locked State / Rescan Overlay */}
        {scanned && (
          <View style={styles.lockedOverlay}>
            <View style={styles.lockedCard}>
              <ThemedText type="smallBold" style={styles.successTitle}>
                Battery Serial No. Captured
              </ThemedText>
              {scannedValue ? (
                <ThemedText type="code" numberOfLines={2} style={styles.scannedText}>
                  {scannedValue}
                </ThemedText>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: '#007AFF' },
                  pressed && styles.buttonPressed,
                ]}
                onPress={onRescan}
              >
                <ThemedText type="default" style={styles.actionButtonText}>
                  Rescan QR Code
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.badgeText}
        >
          {scanned ? 'Scan Locked' : 'Ready'}
        </ThemedText>
      </View>

      {renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
  },
  stateContainer: {
    height: 220,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  centerText: {
    textAlign: 'center',
  },
  cameraViewport: {
    height: 220,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  targetFrame: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#007AFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanInstruction: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 12,
    fontSize: 12,
    overflow: 'hidden',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  lockedCard: {
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  successTitle: {
    color: '#34C759',
  },
  scannedText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  actionButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
