import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Modal } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CameraScannerCardProps = {
  scanned: boolean;
  scannedValue?: string;
  onScan: (data: string) => void;
  onRescan: () => void;
  title?: string;
};

const ZOOM_PRESETS = [
  { label: '1x', val: 0, testID: 'zoom-preset-1x' },
  { label: '2x', val: 0.15, testID: 'zoom-preset-2x' },
  { label: '3x', val: 0.3, testID: 'zoom-preset-3x' },
  { label: '5x', val: 0.5, testID: 'zoom-preset-5x' },
];

export function CameraScannerCard({
  scanned,
  scannedValue,
  onScan,
  onRescan,
  title = 'Battery Serial No.',
}: CameraScannerCardProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [torch, setTorch] = useState(false);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!scanned && result.data) {
      onScan(result.data.slice(0, 9));
      if (fullScreenVisible) {
        setFullScreenVisible(false);
      }
    }
  };

  const handleRescanPress = () => {
    setZoom(0);
    setTorch(false);
    onRescan();
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
          zoom={zoom}
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
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
                onPress={handleRescanPress}
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
        <View style={styles.headerActions}>
          {permission?.granted && !scanned && (
            <Pressable
              testID="expand-camera-button"
              style={({ pressed }) => [
                styles.expandBadge,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setFullScreenVisible(true)}
            >
              <ThemedText type="smallBold" style={styles.expandText}>
                Expand
              </ThemedText>
            </Pressable>
          )}
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.badgeText}
          >
            {scanned ? 'Scan Locked' : 'Ready'}
          </ThemedText>
        </View>
      </View>

      {renderContent()}

      {/* Full-Screen Camera Modal */}
      <Modal
        testID="full-screen-camera-modal"
        visible={fullScreenVisible}
        animationType="slide"
        onRequestClose={() => setFullScreenVisible(false)}
      >
        <View style={styles.fullScreenContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            zoom={zoom}
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />

          {/* Full Screen Header */}
          <View style={styles.fullScreenHeader}>
            <ThemedText type="subtitle" style={styles.fullScreenTitle}>
              QR Scanner
            </ThemedText>
            <View style={styles.fullScreenTopActions}>
              <Pressable
                testID="toggle-torch-button"
                style={({ pressed }) => [
                  styles.pillButton,
                  torch && styles.pillButtonActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setTorch((t) => !t)}
              >
                <ThemedText type="smallBold" style={torch ? styles.pillTextActive : styles.pillText}>
                  {torch ? 'Flash On' : 'Flash Off'}
                </ThemedText>
              </Pressable>
              <Pressable
                testID="close-full-screen-button"
                style={({ pressed }) => [
                  styles.pillButton,
                  styles.closePill,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setFullScreenVisible(false)}
              >
                <ThemedText type="smallBold" style={styles.closePillText}>
                  Close
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Full Screen Viewfinder Overlay */}
          <View style={styles.fullScreenOverlay}>
            <View style={styles.fullScreenTargetFrame}>
              <View style={[styles.corner, styles.cornerTL, styles.cornerLarge]} />
              <View style={[styles.corner, styles.cornerTR, styles.cornerLarge]} />
              <View style={[styles.corner, styles.cornerBL, styles.cornerLarge]} />
              <View style={[styles.corner, styles.cornerBR, styles.cornerLarge]} />
            </View>
            <ThemedText type="small" style={styles.fullScreenInstruction}>
              Align QR Code in target box
            </ThemedText>
          </View>

          {/* Full Screen Bottom Zoom Controls */}
          <View style={styles.fullScreenBottomControls}>
            <View style={styles.zoomPillGroup}>
              {ZOOM_PRESETS.map((preset) => {
                const isActive = zoom === preset.val;
                return (
                  <Pressable
                    key={preset.label}
                    testID={preset.testID}
                    style={({ pressed }) => [
                      styles.zoomPillBtn,
                      isActive && styles.zoomPillBtnActive,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setZoom(preset.val)}
                  >
                    <ThemedText
                      type="smallBold"
                      style={isActive ? styles.zoomPillTextActive : styles.zoomPillText}
                    >
                      {preset.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  expandBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 12,
  },
  expandText: {
    color: '#ffffff',
    fontSize: 11,
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
  cornerLarge: {
    width: 30,
    height: 30,
    borderWidth: 4,
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

  /* Full Screen Modal Styles */
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullScreenTitle: {
    color: '#ffffff',
    fontSize: 18,
  },
  fullScreenTopActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pillButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillButtonActive: {
    backgroundColor: '#FFCC00',
    borderColor: '#FFCC00',
  },
  pillText: {
    color: '#ffffff',
    fontSize: 12,
  },
  pillTextActive: {
    color: '#000000',
    fontSize: 12,
  },
  closePill: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderColor: 'rgba(255, 59, 48, 0.9)',
  },
  closePillText: {
    color: '#ffffff',
    fontSize: 12,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
  },

  fullScreenTargetFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  fullScreenInstruction: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    fontSize: 14,
    overflow: 'hidden',
  },
  fullScreenBottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  zoomPillGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    padding: Spacing.one,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  zoomPillBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 18,
  },
  zoomPillBtnActive: {
    backgroundColor: '#007AFF',
  },
  zoomPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  zoomPillTextActive: {
    color: '#ffffff',
    fontSize: 13,
  },
});

