'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PanelNavItem } from '@/lib/panelNav';
import { logout } from '@/services/vallox/authService';

interface PanelShellProps {
  title: string;
  subtitle: string;
  items: PanelNavItem[];
  children: React.ReactNode;
}

export default function PanelShell({ title, subtitle, items, children }: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Vallox Workspace</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
        >
          {open ? 'Close Menu' : 'Open Menu'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <aside className={`${open ? 'block' : 'hidden'} md:block`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
            <nav className="space-y-1">
              {items.map((item) => {
                if (item.href === '#logout') {
                  return (
                    <button
                      key="logout"
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      {item.label}
                    </button>
                  );
                }

                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
