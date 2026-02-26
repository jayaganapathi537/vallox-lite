import type { UserRole } from '@/models/vallox';

const KEY = 'vallox_role_preference';

export function savePreferredRole(role: UserRole) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, role);
}

export function getPreferredRole(): UserRole {
  if (typeof window === 'undefined') return 'student';
  const value = window.localStorage.getItem(KEY);
  return value === 'organisation' ? 'organisation' : 'student';
}

export function clearPreferredRole() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
