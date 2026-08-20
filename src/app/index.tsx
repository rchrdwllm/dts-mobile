import React, { useState } from 'react';
import { Platform, StyleSheet, ActivityIndicator, Pressable, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components/header';
import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ReferenceInputCard } from '@/components/reference-input-card';
import { ScanPreviewCard } from '@/components/scan-preview-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function HomeScreen() {
  const { isAuthenticated, signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');

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

  const displayName = user?.name || user?.email || 'Operator';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header />

        <ReferenceInputCard
          value={referenceCode}
          onChangeText={setReferenceCode}
        />

        <ScanPreviewCard inputNumber={referenceCode} />

        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Welcome,&nbsp;{displayName}!
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          Google Drive Sync Ready
        </ThemedText>

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
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
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
});
