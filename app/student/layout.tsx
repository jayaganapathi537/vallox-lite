import RoleGate from '@/components/auth/RoleGate';
import PanelShell from '@/components/panels/PanelShell';
import { studentNav } from '@/lib/panelNav';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['student']}>
      <PanelShell
        title="Student Panel"
        subtitle="Build your proof-of-work profile, apply to opportunities, complete tasks, and track growth."
        items={studentNav}
      >
        {children}
      </PanelShell>
    </RoleGate>
  );
}
