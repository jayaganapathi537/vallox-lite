'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAppAuth } from '@/lib/useAppAuth';
import { logout } from '@/services/vallox/authService';

function navLinkClass(active: boolean) {
  return active
    ? 'rounded-lg bg-brand-600 px-3 py-1.5 text-white shadow-sm'
    : 'rounded-lg px-3 py-1.5 text-white/80 transition hover:bg-white/12 hover:text-white';
}

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser } = useAppAuth();

  const links = appUser
    ? appUser.role === 'student'
      ? [
          { href: '/student/dashboard', label: 'Student Panel' },
          { href: '/student/opportunities', label: 'Opportunities' },
          { href: '/student/messages', label: 'Messages' }
        ]
      : appUser.role === 'organisation'
        ? [
            { href: '/organization/dashboard', label: 'Organization Panel' },
            { href: '/organization/opportunities', label: 'Opportunities' },
            { href: '/organization/messages', label: 'Messages' }
          ]
        : [
            { href: '/admin/dashboard', label: 'Admin Panel' },
            { href: '/admin/reports', label: 'Reports' },
            { href: '/admin/audit-logs', label: 'Audit Logs' }
          ]
    : [{ href: '/', label: 'Home' }];

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-ink-900 via-slate-900 to-ink-900 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-semibold tracking-tight text-white" aria-label="Vallox Home">
            Vallox
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(pathname === link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {appUser ? (
            <>
              <span className="hidden text-sm text-white/80 md:inline">{appUser.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" className="bg-brand-600 text-white hover:bg-brand-700">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="sm" className="border-white/25 bg-transparent text-white hover:bg-white/10">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
