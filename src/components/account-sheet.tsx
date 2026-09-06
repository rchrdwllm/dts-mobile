import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { GoogleUser } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

import { AnimatedPressable } from './animated-pressable';
import { ThemedText } from './themed-text';

type AccountSheetProps = {
  visible: boolean;
  user: GoogleUser | null;
  loading: boolean;
  isIosMode: boolean;
  onDismiss: () => void;
  onSignOut: () => void;
};

export function AccountSheet({ visible, user, loading, isIosMode, onDismiss, onSignOut }: AccountSheetProps) {
  const theme = useTheme();

  const name = user?.name || user?.email || 'Connected account';
  const initial = name.charAt(0).toUpperCase();

  return (
    <BottomSheet
      index={visible ? 0 : -1}
      onDismiss={onDismiss}
      enablePanDownToClose
      // @ts-expect-error Expo UI supports testID at runtime, but its current prop type omits it.
      testID="native-account-sheet">
      <View style={styles.sheet}>
        <View style={styles.header}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="subtitle">{initial}</ThemedText>
            </View>
          )}
          <View style={styles.identity}>
            <ThemedText type="small" themeColor="textSecondary">{isIosMode ? 'iOS test account' : 'Google account'}</ThemedText>
            <ThemedText type="default" numberOfLines={1} style={styles.name}>{name}</ThemedText>
            {user?.email && user.name ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>{user.email}</ThemedText>
            ) : null}
          </View>
        </View>

        <View style={[styles.destination, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">{isIosMode ? 'IOS TEST MODE' : 'UPLOAD DESTINATION'}</ThemedText>
          <ThemedText type="default" style={styles.destinationValue}>{isIosMode ? 'Google Drive sync disabled' : 'Shared Target Folder'}</ThemedText>
        </View>

        {!isIosMode ? (
          <AnimatedPressable
            disabled={loading}
            style={[styles.signOut, loading && styles.disabled]}
            onPress={onSignOut}
            accessibilityLabel="Sign out of Google Account">
            {loading ? <ActivityIndicator color="#FF453A" /> : <ThemedText style={styles.signOutText}>Sign Out</ThemedText>}
          </AnimatedPressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { padding: Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, gap: 1 },
  name: { fontWeight: '700' },
  destination: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  destinationValue: { fontWeight: '600' },
  signOut: { minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: '#FF453A', alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: '#FF453A', fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
