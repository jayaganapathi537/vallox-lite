import RoleGate from '@/components/auth/RoleGate';
import PanelShell from '@/components/panels/PanelShell';
import { organizationNav } from '@/lib/panelNav';

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['organisation']}>
      <PanelShell
        title="Organization Panel"
        subtitle="Post roles, evaluate candidates, assign tasks, and hire through real execution signals."
        items={organizationNav}
      >
        {children}
      </PanelShell>
    </RoleGate>
  );
}
