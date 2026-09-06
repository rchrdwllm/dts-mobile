export const IOS_TEST_USER = {
  name: 'iOS Test User',
  photo: null,
  email: 'ios-test@example.invalid',
} as const;

export function isIosMode(): boolean {
  return process.env.EXPO_PUBLIC_IOS_MODE === 'true';
}
