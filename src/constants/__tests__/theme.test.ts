import { Colors } from '../theme';

describe('semantic theme colors', () => {
  it('defines action and feedback colors for both system appearances', () => {
    for (const appearance of [Colors.light, Colors.dark]) {
      expect(appearance.primary).toMatch(/^#/);
      expect(appearance.success).toMatch(/^#/);
      expect(appearance.destructive).toMatch(/^#/);
      expect(appearance.border).toMatch(/^#/);
    }
  });
});
