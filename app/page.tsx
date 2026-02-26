'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppAuth } from '@/lib/useAppAuth';
import { dashboardPathForRole } from '@/lib/routes';

export default function HomePage() {
  const { appUser, loading } = useAppAuth();

  const roleLabel = useMemo(() => {
    if (!appUser) return '';
    if (appUser.role === 'organisation') return 'Organization';
    if (appUser.role === 'admin') return 'Admin';
    return 'Student';
  }, [appUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-sm text-slate-600">Loading workspace...</p>
        </Card>
      </div>
    );
  }

  if (appUser) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Vallox Workspace</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">Welcome back, {appUser.name}</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            You are signed in as a {roleLabel.toLowerCase()}. Continue from your panel to manage opportunities,
            applications, projects, and communication in real time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={dashboardPathForRole(appUser.role)}>
              <Button size="lg">Go to {roleLabel} Panel</Button>
            </Link>
            {appUser.role === 'student' ? (
              <Link href="/student/opportunities">
                <Button size="lg" variant="outline">
                  Browse Opportunities
                </Button>
              </Link>
            ) : null}
            {appUser.role === 'organisation' ? (
              <Link href="/organization/opportunities">
                <Button size="lg" variant="outline">
                  Manage Opportunities
                </Button>
              </Link>
            ) : null}
            {appUser.role === 'admin' ? (
              <Link href="/admin/users">
                <Button size="lg" variant="outline">
                  Manage Users
                </Button>
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-panel">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Vallox Platform</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Hire and onboard by proof-of-work, not by grade sheets.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              Skilled students with strong projects still miss exposure, while organizations struggle to discover
              execution-ready talent. Vallox connects both sides through project-backed profiles and a practical
              matching system.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login?role=organisation">
                <Button size="lg">Organizer</Button>
              </Link>
              <Link href="/auth/login?role=student">
                <Button size="lg" variant="outline">
                  Student
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Problem Statement</p>
            <blockquote className="mt-4 text-2xl font-semibold leading-relaxed text-slate-900">
              "Talent should be measured by what students can build, solve, and deliver, not by where they study."
            </blockquote>
            <p className="mt-5 text-sm text-slate-600">
              Vallox helps teams evaluate capability through proof-of-work, task outcomes, and verified contribution.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
