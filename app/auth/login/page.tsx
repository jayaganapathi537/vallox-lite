'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppAuth } from '@/lib/useAppAuth';
import { dashboardPathForRole } from '@/lib/routes';
import type { UserRole } from '@/models/vallox';
import { loginWithEmail, loginWithGoogle, logout, requestPasswordReset } from '@/services/vallox/authService';
import { getOrCreateUserFromFirebaseIdentity, getUserByEmail, resolveLoginEmailIdentifier } from '@/services/vallox/userService';
import { savePreferredRole } from '@/lib/authStorage';

function parseRoleParam(value: string | null): UserRole {
  if (value === 'organisation') return 'organisation';
  if (value === 'admin') return 'admin';
  return 'student';
}

export default function LoginPage() {
  const router = useRouter();
  const { appUser, loading } = useAppAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const roleTitle = useMemo(() => {
    if (role === 'organisation') return 'Organizer Login';
    if (role === 'admin') return 'Admin Login';
    return 'Student Login';
  }, [role]);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    setRole(parseRoleParam(roleParam));
  }, []);

  useEffect(() => {
    if (loading || !appUser) return;
    router.replace(dashboardPathForRole(appUser.role));
  }, [appUser, loading, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setStatusMessage('');

    try {
      const resolvedEmail = await resolveLoginEmailIdentifier(identifier);
      if (!resolvedEmail) {
        throw new Error('Account not found with this username. Try your registered email.');
      }

      if (role === 'admin') {
        const adminUser = await getUserByEmail(resolvedEmail);
        if (!adminUser || adminUser.role !== 'admin') {
          throw new Error('Admin access denied. Use a provisioned admin account.');
        }

        const firebaseUser = await loginWithEmail(resolvedEmail, password);
        if (firebaseUser.uid !== adminUser.id) {
          await logout();
          throw new Error('Admin account mismatch. Check your credentials.');
        }

        router.replace('/admin/dashboard');
        return;
      }

      savePreferredRole(role);
      const firebaseUser = await loginWithEmail(resolvedEmail, password);
      const user = await getOrCreateUserFromFirebaseIdentity(
        {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email
        },
        role
      );

      router.replace(dashboardPathForRole(user.role));
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Unable to log in.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setResettingPassword(true);
    setError('');
    setStatusMessage('');

    try {
      const resolvedEmail = await resolveLoginEmailIdentifier(identifier);
      if (!resolvedEmail) {
        throw new Error('Enter your registered email or username first.');
      }

      await requestPasswordReset(resolvedEmail);
      setStatusMessage(`Password reset email sent to ${resolvedEmail}.`);
    } catch (forgotError) {
      const message = forgotError instanceof Error ? forgotError.message : 'Unable to send password reset email.';
      setError(message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');
    setStatusMessage('');

    try {
      if (role === 'admin') {
        throw new Error('Admin login is restricted to email and password.');
      }

      savePreferredRole(role);
      const result = await loginWithGoogle(role);
      router.replace(dashboardPathForRole(result.appUser.role));
    } catch (googleError) {
      const message = googleError instanceof Error ? googleError.message : 'Google sign-in failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Card className="space-y-5 p-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{roleTitle}</p>
          <h1 className="text-3xl font-semibold text-slate-900">Welcome back to Vallox</h1>
          <p className="text-sm text-slate-600">Use your username/email and password to enter your panel.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              role === 'student' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              role === 'organisation' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => setRole('organisation')}
          >
            Organizer
          </button>
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              role === 'admin' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <Input
            label="Username / Mail ID"
            placeholder="you@example.com"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {statusMessage && <p className="text-sm text-emerald-700">{statusMessage}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="font-semibold text-brand-700"
              onClick={handleForgotPassword}
              disabled={resettingPassword || submitting}
            >
              {resettingPassword ? 'Sending reset link...' : 'Forgot password?'}
            </button>
            {role === 'admin' ? (
              <span className="text-xs text-slate-500">Admin accounts are created by platform owner.</span>
            ) : (
              <Link href={`/auth/signup?role=${role}`} className="font-semibold text-brand-700">
                New Registration
              </Link>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting || resettingPassword}>
            {submitting ? 'Logging in...' : 'Login'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={submitting || resettingPassword || role === 'admin'}
          >
            {role === 'admin' ? 'Google disabled for Admin' : 'Continue with Google'}
          </Button>
        </form>
      </Card>

      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-600 via-brand-500 to-ink-900 p-8 text-white shadow-panel">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Proof-of-Work Platform</p>
          <h2 className="text-4xl font-semibold leading-tight">Build. Verify. Match. Get hired for your real skills.</h2>
          <p className="max-w-md text-white/90">
            Vallox helps students show real-world capability through projects, tasks, and verified outcomes while
            organizations discover and onboard talent faster.
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">Role-based access control</div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">Real-time notifications</div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">Project-first profiles</div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">Match & trust scoring</div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
            <Image
              src="/auth-work-illustration.svg"
              alt="Students and organizations collaborating through proof-of-work opportunities"
              width={880}
              height={620}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
