import React, { useState } from 'react';
import { StyleSheet, Pressable, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useAuth } from '@/hooks/use-auth';
import { Spacing } from '@/constants/theme';

export function Header() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch {
      // Errors are logged in hook, can be handled or displayed here if needed
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch {
      // Handle sign-out error
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView type="backgroundSelected" style={styles.headerContainer}>
      {isAuthenticated && user ? (
        <View style={styles.contentRow}>
          <View style={styles.userInfo}>
            {user.photo ? (
              <Image 
                source={{ uri: user.photo }} 
                style={styles.avatar} 
                contentFit="cover"
                transition={200}
              />
            ) : (
              <ThemedView type="backgroundElement" style={styles.avatarPlaceholder}>
                <ThemedText type="smallBold" style={styles.avatarPlaceholderText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </ThemedText>
              </ThemedView>
            )}
            <View style={styles.textDetails}>
              <ThemedText type="small" themeColor="textSecondary">Signed In</ThemedText>
              <ThemedText type="default" style={styles.userName}>{user.name || user.email}</ThemedText>
            </View>
          </View>
          <Pressable 
            disabled={loading}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled
            ]} 
            onPress={handleSignOut}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <ThemedText type="smallBold" style={styles.signOutText}>Sign Out</ThemedText>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.userInfo}>
            <ThemedView type="backgroundElement" style={styles.avatarPlaceholder}>
              <ThemedText type="smallBold" style={styles.avatarPlaceholderText}>?</ThemedText>
            </ThemedView>
            <View style={styles.textDetails}>
              <ThemedText type="small" themeColor="textSecondary">Access Control</ThemedText>
              <ThemedText type="default" style={styles.userName}>Not Authenticated</ThemedText>
            </View>
          </View>
          <Pressable 
            disabled={loading}
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled
            ]} 
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.signInText}>Sign In</ThemedText>
            )}
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    marginVertical: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 16,
  },
  textDetails: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  userName: {
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  signInText: {
    color: '#ffffff',
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  signOutText: {
    color: '#FF3B30',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
