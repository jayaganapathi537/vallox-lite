import AppNavbar from '@/components/layout/AppNavbar';
import FirebaseConfigNotice from '@/components/common/FirebaseConfigNotice';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AppNavbar />
      <FirebaseConfigNotice />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white/90 py-6">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-2 px-4 text-sm text-slate-600 sm:grid-cols-2 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Vallox. All rights reserved - Vallox.</p>
          <p className="text-left font-semibold text-slate-800 sm:text-right">Team Algovengers</p>
        </div>
      </footer>
    </div>
  );
}
