import RoleGate from '@/components/auth/RoleGate';
import PanelShell from '@/components/panels/PanelShell';
import { adminNav } from '@/lib/panelNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['admin']}>
      <PanelShell
        title="Admin Panel"
        subtitle="Monitor platform quality, moderation, verification, billing, and system health."
        items={adminNav}
      >
        {children}
      </PanelShell>
    </RoleGate>
  );
}
