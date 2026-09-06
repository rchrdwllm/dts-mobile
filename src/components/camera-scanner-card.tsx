import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';

import { Spacing } from '@/constants/theme';
import { sanitizeAlphanumeric } from '@/utils/sanitize';

import { ThemedText } from './themed-text';

export type CameraScannerCardProps = {
  isOpen: boolean;
  onDismiss: () => void;
  onScan: (data: string) => void;
};

export function CameraScannerCard({ isOpen, onDismiss, onScan }: CameraScannerCardProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const useFallback = !CameraView.isModernBarcodeScannerAvailable;

  const completeScan = useCallback((data: string) => {
    const serial = sanitizeAlphanumeric(data, 9);
    if (!serial) return;
    onScan(serial);
  }, [onScan]);

  useEffect(() => {
    if (!isOpen || useFallback) return;

    const subscription = CameraView.onModernBarcodeScanned((result) => {
      void CameraView.dismissScanner();
      completeScan(result.data);
    });

    void CameraView.launchScanner({ barcodeTypes: ['qr', 'datamatrix'] }).catch(() => {
      subscription.remove();
      onDismiss();
    });

    return () => subscription.remove();
  }, [completeScan, isOpen, onDismiss, useFallback]);

  const handleFallbackScan = (result: BarcodeScanningResult) => {
    completeScan(result.data);
  };

  if (!isOpen || !useFallback) return null;

  const permissionContent = !permission ? (
    <View style={styles.centeredState}>
      <ActivityIndicator />
      <ThemedText themeColor="textSecondary">Preparing camera…</ThemedText>
    </View>
  ) : !permission.granted ? (
    <View style={styles.centeredState}>
      <ThemedText style={styles.permissionText}>
        Camera access is required to scan a battery QR code.
      </ThemedText>
      <Pressable style={styles.primaryButton} onPress={requestPermission}>
        <ThemedText style={styles.primaryButtonText}>Allow Camera Access</ThemedText>
      </Pressable>
    </View>
  ) : (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr', 'datamatrix'] }}
      onBarcodeScanned={handleFallbackScan}
    />
  );

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <View style={styles.cameraArea}>{permissionContent}</View>
        {permission?.granted ? (
          <View pointerEvents="none" style={styles.overlay}>
            <View style={styles.targetFrame} />
            <ThemedText style={styles.scanInstruction}>Align the battery QR code in the frame</ThemedText>
          </View>
        ) : null}
        <Pressable
          style={styles.cancelButton}
          onPress={onDismiss}
          accessibilityLabel="Cancel battery scan">
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraArea: { flex: 1 },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#ffffff',
  },
  permissionText: { textAlign: 'center' },
  primaryButton: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  targetFrame: { width: 236, height: 236, borderWidth: 3, borderColor: '#ffffff', borderRadius: Spacing.three },
  scanInstruction: {
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cancelButton: {
    position: 'absolute',
    top: 64,
    left: Spacing.three,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cancelButtonText: { color: '#ffffff', fontWeight: '700' },
});
