'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppAuth } from '@/lib/useAppAuth';
import type { UserRole } from '@/models/vallox';
import { dashboardPathForRole, onboardingPathForRole } from '@/lib/routes';
import LoadingState from '@/components/common/LoadingState';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireOnboardingComplete?: boolean;
  requireOnboardingIncomplete?: boolean;
}

export default function RoleGate({
  children,
  allowedRoles,
  requireOnboardingComplete = false,
  requireOnboardingIncomplete = false
}: RoleGateProps) {
  const { firebaseUser, appUser, loading } = useAppAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace('/auth/login');
      return;
    }

    // User is authenticated but profile bootstrap is still in progress.
    if (!appUser) {
      return;
    }

    if (allowedRoles && !allowedRoles.includes(appUser.role)) {
      router.replace(dashboardPathForRole(appUser.role));
      return;
    }

    if (requireOnboardingComplete && !appUser.onboardingComplete) {
      const target = onboardingPathForRole(appUser.role);
      if (pathname !== target) {
        router.replace(target);
      }
      return;
    }

    if (requireOnboardingIncomplete && appUser.onboardingComplete) {
      router.replace(dashboardPathForRole(appUser.role));
    }
  }, [
    allowedRoles,
    appUser,
    firebaseUser,
    loading,
    pathname,
    requireOnboardingComplete,
    requireOnboardingIncomplete,
    router
  ]);

  if (loading) {
    return <LoadingState message="Loading account..." />;
  }

  if (!firebaseUser) {
    return <LoadingState message="Redirecting to login..." />;
  }

  if (!appUser) {
    return <LoadingState message="Preparing your account..." />;
  }

  if (allowedRoles && !allowedRoles.includes(appUser.role)) {
    return <LoadingState message="Redirecting to your workspace..." />;
  }

  if (requireOnboardingComplete && !appUser.onboardingComplete) {
    return <LoadingState message="Redirecting to onboarding..." />;
  }

  if (requireOnboardingIncomplete && appUser.onboardingComplete) {
    return <LoadingState message="Redirecting to dashboard..." />;
  }

  return <>{children}</>;
}
