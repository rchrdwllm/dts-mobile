import React, { useState } from 'react';
import { Platform, StyleSheet, ActivityIndicator, Pressable, View, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ReferenceInputCard } from '@/components/reference-input-card';
import { ScanPreviewCard } from '@/components/scan-preview-card';
import { CameraScannerCard } from '@/components/camera-scanner-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { syncScanToGoogleDrive } from '@/utils/gdrive';

export default function HomeScreen() {
  const { isAuthenticated, signIn, user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [scannedQrData, setScannedQrData] = useState('');

  const handleSync = async () => {
    if (!referenceCode || !scannedQrData) {
      return;
    }
    setSyncing(true);
    try {
      await syncScanToGoogleDrive(referenceCode, scannedQrData);
      Alert.alert(
        'Sync Successful',
        'Your scan record has been successfully uploaded to Google Drive.'
      );
      setScannedQrData('');
    } catch (e) {
      console.error('Sync to Google Drive failed:', e);
      Alert.alert(
        'Sync Failed',
        e instanceof Error ? e.message : 'An unknown error occurred during sync.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch (e) {
      console.error('Sign-in failed on Home screen:', e);
      Alert.alert(
        'Sign-in Failed',
        e instanceof Error ? e.message : 'An unknown error occurred during sign-in.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.gateContainer}>
        <SafeAreaView style={styles.gateSafeArea}>
          <View style={styles.gateHero}>
            <AnimatedIcon />
            <ThemedText type="title" style={styles.gateTitle}>
              QR Sync
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.gateSubtitle}>
              Please sign in with your Google account to authorize scan uploads to Google Drive.
            </ThemedText>
          </View>

          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.gateButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText type="default" style={styles.gateButtonText}>
                Sign In with Google
              </ThemedText>
            )}
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <ReferenceInputCard
            value={referenceCode}
            onChangeText={setReferenceCode}
          />

          <CameraScannerCard
            scanned={Boolean(scannedQrData)}
            scannedValue={scannedQrData}
            onScan={(data) => setScannedQrData(data)}
            onRescan={() => setScannedQrData('')}
          />

          <ScanPreviewCard
            inputNumber={referenceCode}
            qrCodeData={scannedQrData || undefined}
          />

          <Pressable
            disabled={!referenceCode || !scannedQrData || syncing}
            style={({ pressed }) => [
              styles.syncButton,
              (!referenceCode || !scannedQrData) && styles.syncButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSync}
            accessibilityLabel="Save scan to Google Drive"
          >
            <ThemedText type="default" style={styles.syncButtonText}>
              Save to Google Drive
            </ThemedText>
          </Pressable>

          <Modal transparent visible={syncing} animationType="fade">
            <View style={styles.overlayContainer}>
              <View style={[styles.overlayCard, { backgroundColor: theme.backgroundElement }]}>
                <ActivityIndicator size="large" color="#007AFF" style={styles.overlaySpinner} />
                <ThemedText type="default" style={[styles.overlayText, { color: theme.text }]}>
                  Syncing to Google Drive...
                </ThemedText>
              </View>
            </View>
          </Modal>

          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <HintRow
              title="Account Connected"
              hint={<ThemedText type="small">{user?.email}</ThemedText>}
            />
            <HintRow
              title="Folder Destination"
              hint={<ThemedText type="code">/QRScannerGDrive</ThemedText>}
            />
            <HintRow
              title="Reference Batch"
              hint={
                <ThemedText type="code">
                  {referenceCode ? referenceCode : '(None set)'}
                </ThemedText>
              }
            />
          </ThemedView>

          {Platform.OS === 'web' && <WebBadge />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateSafeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  gateHero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  gateTitle: {
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  gateSubtitle: {
    textAlign: 'center',
    marginTop: Spacing.two,
    maxWidth: 320,
  },
  gateButton: {
    backgroundColor: '#007AFF',
    alignSelf: 'stretch',
    paddingVertical: Spacing.two,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    height: 48,
  },
  gateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    alignSelf: 'stretch',
    paddingVertical: Spacing.two,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    height: 48,
    marginTop: Spacing.two,
  },
  syncButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  syncButtonDisabled: {
    backgroundColor: '#AEAEB2',
    shadowColor: 'transparent',
    elevation: 0,
    opacity: 0.5,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    padding: Spacing.five,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 200,
  },
  overlaySpinner: {
    marginBottom: Spacing.one,
  },
  overlayText: {
    fontWeight: '600',
  },
});
