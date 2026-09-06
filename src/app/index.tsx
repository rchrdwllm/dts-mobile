import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Easing, FadeInDown, FadeOutLeft, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountSheet } from '@/components/account-sheet';
import { AnimatedIcon } from '@/components/animated-icon';
import { AnimatedPressable } from '@/components/animated-pressable';
import { CameraScannerCard } from '@/components/camera-scanner-card';
import { ReferenceInputCard } from '@/components/reference-input-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isIosMode } from '@/config/ios-mode';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { syncScansToGoogleDrive } from '@/utils/gdrive';
import { sanitizeAlphanumeric } from '@/utils/sanitize';

const WORKFLOW_ENTER = FadeInDown.duration(250)
  .easing(Easing.bezier(0.23, 1, 0.32, 1))
  .reduceMotion(ReduceMotion.System);
const SCAN_ROW_ENTER = FadeInDown.duration(200)
  .easing(Easing.bezier(0.23, 1, 0.32, 1))
  .reduceMotion(ReduceMotion.System);
const SCAN_ROW_EXIT = FadeOutLeft.duration(200)
  .easing(Easing.bezier(0.23, 1, 0.32, 1))
  .reduceMotion(ReduceMotion.System);
const SCAN_ROW_LAYOUT = LinearTransition.duration(200);

type PendingScan = {
  id: string;
  droneSerial: string;
  batteryCode: string;
};

export default function HomeScreen() {
  const { isAuthenticated, isLoading, signIn, signOut, user } = useAuth();
  const iosMode = isIosMode();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [droneSerialInput, setDroneSerialInput] = useState('');
  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);

  const handleSync = async () => {
    if (iosMode || pendingScans.length === 0) return;
    setSyncing(true);
    try {
      await syncScansToGoogleDrive(pendingScans.map(({ batteryCode, droneSerial }) => ({ batteryCode, droneSerial })));
      Alert.alert('Sync Successful', `${pendingScans.length} scan record${pendingScans.length === 1 ? '' : 's'} uploaded to Google Drive.`);
      setPendingScans([]);
    } catch (error) {
      const isDuplicate = error instanceof Error && error.message.includes('already exists in');
      Alert.alert(
        isDuplicate ? 'Duplicate Scan' : 'Sync Failed',
        error instanceof Error ? error.message : 'An unknown error occurred during sync.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch (error) {
      Alert.alert('Sign-in Failed', error instanceof Error ? error.message : 'An unknown error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setAccountOpen(false);
    } catch (error) {
      Alert.alert('Sign-out Failed', error instanceof Error ? error.message : 'An unknown error occurred during sign-out.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={styles.gateContainer} testID="auth-loading-indicator">
          <ActivityIndicator size="large" color="#007AFF" />
        </ThemedView>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={styles.gateContainer}>
          <SafeAreaView style={styles.gateSafeArea}>
            <View style={styles.gateHero}>
              <AnimatedIcon />
              <ThemedText type="title" style={styles.gateTitle}>DTS</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.gateSubtitle}>
                Scan battery serials and securely save each record to your shared Google Drive folder.
              </ThemedText>
            </View>
            <AnimatedPressable
              disabled={loading}
              style={[styles.primaryButton, loading && styles.disabled]}
              onPress={handleSignIn}>
              {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.primaryButtonText}>Continue with Google</ThemedText>}
            </AnimatedPressable>
          </SafeAreaView>
        </ThemedView>
      </>
    );
  }

  const hasDroneSerial = Boolean(droneSerialInput);
  const hasPendingScans = pendingScans.length > 0;
  const removeScan = (id: string) => setPendingScans((scans) => scans.filter((scan) => scan.id !== id));

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={[styles.accountButton, { backgroundColor: theme.backgroundElement }]}
              onPress={() => setAccountOpen(true)}
              accessibilityLabel="Open account details">
              {user?.photo ? (
                <Image
                  source={{ uri: user.photo }}
                  style={styles.accountProfilePhoto}
                  contentFit="cover"
                  testID="header-profile-photo"
                />
              ) : (
                <ThemedText type="smallBold">{user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}</ThemedText>
              )}
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>

        <ScrollView contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <ThemedText type="default" style={styles.introTitle}>Build a scan batch</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Enter a drone serial and scan as many battery pairs as needed before saving.</ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}><ThemedText type="smallBold" style={styles.stepNumberText}>1</ThemedText></View>
              <View><ThemedText type="default" style={styles.stepTitle}>Drone serial</ThemedText><ThemedText type="small" themeColor="textSecondary">Required before scanning</ThemedText></View>
            </View>
            <ReferenceInputCard value={droneSerialInput} onChangeText={(text) => setDroneSerialInput(sanitizeAlphanumeric(text, 9))} />
          </ThemedView>

          <Animated.View entering={WORKFLOW_ENTER}>
            <ThemedView type="backgroundElement" style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumber, !hasDroneSerial && styles.inactiveNumber]}><ThemedText type="smallBold" style={styles.stepNumberText}>2</ThemedText></View>
                <View><ThemedText type="default" style={styles.stepTitle}>Battery QR code</ThemedText><ThemedText type="small" themeColor="textSecondary">Use your device camera to capture it.</ThemedText></View>
              </View>
              <AnimatedPressable
                disabled={!hasDroneSerial}
                style={[styles.primaryButton, !hasDroneSerial && styles.disabledButton]}
                onPress={() => setScannerOpen(true)}
                accessibilityLabel="Scan battery QR code">
                <ThemedText style={styles.primaryButtonText}>{hasDroneSerial ? 'Scan battery' : 'Enter drone serial first'}</ThemedText>
              </AnimatedPressable>
            </ThemedView>
          </Animated.View>

          <ThemedView type="backgroundElement" style={styles.reviewCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumber, hasPendingScans ? styles.successNumber : styles.inactiveNumber]}><ThemedText type="smallBold" style={styles.stepNumberText}>{hasPendingScans ? '✓' : '3'}</ThemedText></View>
              <View style={styles.reviewCopy}>
                <ThemedText type="default" style={styles.stepTitle}>{hasPendingScans ? `${pendingScans.length} scan${pendingScans.length === 1 ? '' : 's'} ready` : 'Review scans'}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{hasPendingScans ? 'Swipe a row left to remove it before saving.' : 'Scans will be listed here before saving.'}</ThemedText>
              </View>
            </View>
            <View style={styles.scanList}>
              {hasPendingScans ? pendingScans.map((scan, index) => (
                <Animated.View key={scan.id} entering={SCAN_ROW_ENTER} exiting={SCAN_ROW_EXIT} layout={SCAN_ROW_LAYOUT}>
                  <ReanimatedSwipeable
                    containerStyle={styles.swipeableRow}
                    friction={2}
                    rightThreshold={40}
                    onSwipeableOpen={(direction) => {
                      if (direction === SwipeDirection.RIGHT) removeScan(scan.id);
                    }}
                    renderRightActions={() => (
                      <Pressable style={styles.deleteAction} onPress={() => removeScan(scan.id)} accessibilityLabel={`Remove scan ${index + 1}`}>
                        <ThemedText type="smallBold" style={styles.deleteActionText}>Remove</ThemedText>
                      </Pressable>
                    )}>
                    <View style={[styles.scanRow, { backgroundColor: theme.background }]}>
                      <ThemedText type="smallBold" style={styles.scanIndex}>{index + 1}</ThemedText>
                      <View style={styles.scanValues}>
                        <ThemedText type="small" themeColor="textSecondary">Drone {scan.droneSerial}</ThemedText>
                        <ThemedText type="code" style={[styles.scanBattery, { color: theme.text }]}>{scan.batteryCode}</ThemedText>
                      </View>
                    </View>
                  </ReanimatedSwipeable>
                </Animated.View>
              )) : (
                <Animated.View entering={SCAN_ROW_ENTER} exiting={SCAN_ROW_EXIT} style={styles.emptyScanList}>
                  <ThemedText type="small" themeColor="textSecondary">No scans yet</ThemedText>
                </Animated.View>
              )}
            </View>
          </ThemedView>

          <View style={styles.footerCredits}>
            <ThemedText type="smallBold">DTS</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">By Richard William Flores</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Expires September 2027</ThemedText>
          </View>
        </ScrollView>

        {hasPendingScans ? (
          <View style={[styles.bottomAction, { backgroundColor: theme.background }]}>
            <AnimatedPressable
              disabled={syncing || iosMode}
              style={[styles.primaryButton, (syncing || iosMode) && styles.disabled]}
              onPress={handleSync}
              accessibilityLabel={iosMode ? 'Google Drive unavailable in iOS mode' : 'Save scan to Google Drive'}>
              {syncing ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.primaryButtonText}>{iosMode ? 'Save unavailable in iOS mode' : 'Save to Google Drive'}</ThemedText>}
            </AnimatedPressable>
            {iosMode ? <ThemedText type="small" themeColor="textSecondary" style={styles.syncUnavailableText}>Google Drive unavailable in iOS mode</ThemedText> : null}
          </View>
        ) : null}
      </SafeAreaView>

      <CameraScannerCard
        isOpen={scannerOpen}
        onDismiss={() => setScannerOpen(false)}
        onScan={(data) => {
          setPendingScans((scans) => [...scans, {
            id: `${Date.now()}-${data}-${scans.length}`,
            droneSerial: droneSerialInput,
            batteryCode: data,
          }]);
          setScannerOpen(false);
        }}
      />
      <AccountSheet visible={accountOpen} user={user} loading={loading} isIosMode={iosMode} onDismiss={() => setAccountOpen(false)} onSignOut={handleSignOut} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  accountButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  accountProfilePhoto: { width: 44, height: 44, borderRadius: 22 },
  scrollContent: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  intro: { gap: Spacing.one, marginBottom: Spacing.one },
  introTitle: { fontWeight: '700' },
  stepCard: { borderRadius: 20, padding: Spacing.three, gap: Spacing.three },
  reviewCard: { borderRadius: 20, padding: Spacing.three, gap: Spacing.three },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  successNumber: { backgroundColor: '#34C759' },
  inactiveNumber: { backgroundColor: '#8E8E93' },
  stepNumberText: { color: '#ffffff', fontWeight: '800' },
  stepTitle: { fontWeight: '700' },
  reviewCopy: { flex: 1 },
  scanList: { gap: Spacing.two },
  swipeableRow: { borderRadius: Spacing.two, overflow: 'hidden' },
  scanRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  emptyScanList: { minHeight: 120, borderRadius: Spacing.two, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(128, 128, 128, 0.35)', borderStyle: 'dashed' },
  footerCredits: { alignItems: 'center', gap: Spacing.one, paddingTop: Spacing.three, paddingBottom: Spacing.four },
  scanIndex: { width: 24, color: '#007AFF', textAlign: 'center' },
  scanValues: { flex: 1, gap: Spacing.one },
  scanBattery: { fontSize: 16 },
  deleteAction: { width: 96, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF3B30' },
  deleteActionText: { color: '#ffffff' },
  primaryButton: { minHeight: 52, borderRadius: 26, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  bottomAction: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128, 128, 128, 0.25)', gap: Spacing.two },
  syncUnavailableText: { textAlign: 'center' },
  disabled: { opacity: 0.55 },
  disabledButton: { backgroundColor: '#8E8E93' },
  gateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gateSafeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, justifyContent: 'center', gap: Spacing.five, padding: Spacing.four },
  gateHero: { alignItems: 'center', gap: Spacing.two },
  gateTitle: { fontSize: 40, lineHeight: 46, fontWeight: '800' },
  gateSubtitle: { maxWidth: 330, textAlign: 'center' },
});
