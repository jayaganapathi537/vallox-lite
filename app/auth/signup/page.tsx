'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppAuth } from '@/lib/useAppAuth';
import { dashboardPathForRole } from '@/lib/routes';
import type { UserRole } from '@/models/vallox';
import { loginWithGoogle, registerWithEmail } from '@/services/vallox/authService';
import { savePreferredRole } from '@/lib/authStorage';

export default function SignUpPage() {
  const router = useRouter();
  const { appUser, loading } = useAppAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    setRole(roleParam === 'organisation' ? 'organisation' : 'student');
  }, []);

  useEffect(() => {
    if (loading || !appUser) return;
    router.replace(dashboardPathForRole(appUser.role));
  }, [appUser, loading, router]);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Password and confirm password should match.');
      setSubmitting(false);
      return;
    }

    try {
      savePreferredRole(role);
      const result = await registerWithEmail({ name: username, email, password, role });
      if (phone.trim()) {
        // Reserved for future profile contact enrichment.
      }
      router.replace(dashboardPathForRole(result.appUser.role));
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : 'Unable to create account.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');

    try {
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
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card className="space-y-4 p-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{role === 'student' ? 'Student Signup' : 'Organizer Signup'}</p>
          <h1 className="text-3xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-600">Register with your details to access proof-of-work opportunities.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              role === 'student' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              role === 'organisation' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => setRole('organisation')}
          >
            Organizer
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSignUp}>
          <Input label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          <Input label="Mail ID" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <Input label="Phone Number" value={phone} onChange={(event) => setPhone(event.target.value)} required />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign Up'}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={submitting}>
            Continue with Google
          </Button>

          <p className="text-sm text-slate-600">
            Already registered?{' '}
            <Link href={`/auth/login?role=${role}`} className="font-semibold text-brand-700">
              Login
            </Link>
          </p>
        </form>
      </Card>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Why Vallox</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Your work should speak louder than your resume.</h2>
        <p className="mt-3 text-sm text-slate-600">
          Showcase projects, hackathons, GitHub work, and verified outcomes. Get matched with organizations that care
          about ability, speed, and impact.
        </p>

        <div className="mt-6 grid gap-3">
          {[
            'Proof-of-work profiles for each student',
            'Opportunity matching engine based on real skills',
            'Task-based hiring and verification flow',
            'Admin trust controls and audit trails'
          ].map((item) => (
            <div key={item} className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
