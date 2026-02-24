type UserLike = {
  id?: string | number;
  userId?: string | number;
  merchantId?: string | number;
  role?: string;
} | null;

export function getStoredUser(): UserLike {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

/**
 * 统一解析登录态，兼容历史字段：
 * - id（当前主字段）
 * - userId / merchantId（兜底字段）
 */
export function resolveUserIdentity(inputUser?: UserLike) {
  const user = inputUser && typeof inputUser === 'object' ? inputUser : getStoredUser();
  const role = user?.role || '';
  const userId = user?.id || user?.userId || user?.merchantId || '';
  return {
    user: user || null,
    role,
    userId: userId ? String(userId) : ''
  };
}
