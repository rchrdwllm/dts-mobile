import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

const isIos26OrLater = Platform.OS === 'ios' && Number(Platform.Version) >= 26;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: true }}>
          <Stack.Screen
            name="index"
            options={{
              title: 'DTS',
              ...(isIos26OrLater
                ? {
                  headerLargeTitleEnabled: true,
                  headerTransparent: true,
                  headerShadowVisible: true,
                  scrollEdgeEffects: { top: 'automatic' },
                  }
                : Platform.OS === 'ios'
                  ? {
                      headerLargeTitleEnabled: false,
                      headerTransparent: true,
                      headerBlurEffect: 'regular',
                      headerShadowVisible: true,
                    }
                : {
                    headerLargeTitleEnabled: false,
                    headerTransparent: false,
                  }),
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
