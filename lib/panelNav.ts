export interface PanelNavItem {
  label: string;
  href: string;
}

export const studentNav: PanelNavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard' },
  { label: 'My Projects', href: '/student/projects' },
  { label: 'Public Profile', href: '/student/public-profile' },
  { label: 'Opportunities', href: '/student/opportunities' },
  { label: 'Applications', href: '/student/applications' },
  { label: 'Tasks', href: '/student/tasks' },
  { label: 'Skills & Interests', href: '/student/skills-interests' },
  { label: 'Achievements', href: '/student/achievements' },
  { label: 'Messages', href: '/student/messages' },
  { label: 'Verification', href: '/student/verification' },
  { label: 'Settings', href: '/student/settings' },
  { label: 'Logout', href: '#logout' }
];

export const organizationNav: PanelNavItem[] = [
  { label: 'Dashboard', href: '/organization/dashboard' },
  { label: 'Talent Discovery', href: '/organization/talent' },
  { label: 'Opportunities', href: '/organization/opportunities' },
  { label: 'Applications', href: '/organization/applications' },
  { label: 'Task Management', href: '/organization/tasks' },
  { label: 'Candidate Performance', href: '/organization/performance' },
  { label: 'Messages', href: '/organization/messages' },
  { label: 'Verification', href: '/organization/verification' },
  { label: 'Settings', href: '/organization/settings' },
  { label: 'Logout', href: '#logout' }
];

export const adminNav: PanelNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'User Management', href: '/admin/users' },
  { label: 'Organizations', href: '/admin/organizations' },
  { label: 'Students', href: '/admin/students' },
  { label: 'Verification Control', href: '/admin/verification' },
  { label: 'Opportunity Moderation', href: '/admin/opportunities' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Communication', href: '/admin/communications' },
  { label: 'System Settings', href: '/admin/system-settings' },
  { label: 'Billing', href: '/admin/billing' },
  { label: 'Audit Logs', href: '/admin/audit-logs' },
  { label: 'Logout', href: '#logout' }
];
