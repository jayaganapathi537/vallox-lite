'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingState from '@/components/common/LoadingState';
import { useAppAuth } from '@/lib/useAppAuth';
import { dashboardPathForRole, onboardingPathForRole } from '@/lib/routes';

export default function DashboardIndexPage() {
  const router = useRouter();
  const { appUser, loading } = useAppAuth();

  useEffect(() => {
    if (loading) return;

    if (!appUser) {
      router.replace('/auth/login');
      return;
    }

    if (appUser.onboardingComplete) {
      router.replace(dashboardPathForRole(appUser.role));
      return;
    }

    router.replace(onboardingPathForRole(appUser.role));
  }, [appUser, loading, router]);

  return <LoadingState message="Redirecting to your dashboard..." />;
}
