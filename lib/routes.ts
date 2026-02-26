import type { UserRole } from '@/models/vallox';

export function dashboardPathForRole(role: UserRole) {
  if (role === 'student') return '/student/dashboard';
  if (role === 'organisation') return '/organization/dashboard';
  return '/admin/dashboard';
}

export function onboardingPathForRole(role: UserRole) {
  return dashboardPathForRole(role);
}
