import { getStoredUser, resolveUserIdentity } from './userIdentity';

describe('userIdentity utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getStoredUser returns null when storage is empty', () => {
    expect(getStoredUser()).toBeNull();
  });

  test('resolveUserIdentity falls back to merchantId', () => {
    localStorage.setItem('user', JSON.stringify({ merchantId: 123, role: 'merchant' }));
    const result = resolveUserIdentity();
    expect(result.userId).toBe('123');
    expect(result.role).toBe('merchant');
  });
});
