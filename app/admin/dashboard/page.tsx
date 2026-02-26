'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import StatCard from '@/components/panels/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { getAllApplications } from '@/services/vallox/applicationService';
import { getAllOpportunities } from '@/services/vallox/opportunityService';
import { getAllOrganisationProfiles } from '@/services/vallox/organisationService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';
import { getAllUsers } from '@/services/vallox/userService';
import { getAllReports, getAuditLogs } from '@/services/vallox/adminOpsService';
import { getAllVerificationRequests } from '@/services/vallox/verificationService';
import type { Application, AuditLog, BaseUser, Opportunity, PlatformReport, VerificationRequest } from '@/models/vallox';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<BaseUser[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [organizationCount, setOrganizationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [allUsers, allOpportunities, allApplications, studentProfiles, orgProfiles, allReports, allLogs, allVerifications] = await Promise.all([
        getAllUsers(),
        getAllOpportunities(),
        getAllApplications(),
        getAllStudentProfiles(),
        getAllOrganisationProfiles(),
        getAllReports(),
        getAuditLogs(),
        getAllVerificationRequests()
      ]);

      setUsers(allUsers);
      setOpportunities(allOpportunities);
      setApplications(allApplications);
      setStudentCount(studentProfiles.length);
      setOrganizationCount(orgProfiles.length);
      setReports(allReports);
      setAuditLogs(allLogs);
      setVerifications(allVerifications);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => (user.status ?? 'active') === 'active').length;
    const suspendedUsers = users.filter((user) => (user.status ?? 'active') === 'suspended').length;
    const activeOpportunities = opportunities.filter((opportunity) => opportunity.status === 'open').length;
    const shortlisted = applications.filter((application) => application.status === 'shortlisted').length;
    const pendingReports = reports.filter((report) => report.status === 'pending').length;
    const pendingVerifications = verifications.filter((item) => item.status === 'pending').length;
    const conversion = applications.length ? Math.round((shortlisted / applications.length) * 100) : 0;

    return {
      totalUsers: users.length,
      activeUsers,
      suspendedUsers,
      studentCount,
      organizationCount,
      activeOpportunities,
      totalApplications: applications.length,
      shortlisted,
      conversion,
      pendingReports,
      pendingVerifications
    };
  }, [applications, opportunities, organizationCount, reports, studentCount, users, verifications]);

  const topSkills = useMemo(() => {
    const counter = opportunities.reduce<Record<string, number>>((acc, opportunity) => {
      opportunity.requiredSkills.forEach((skill) => {
        const key = skill.trim();
        if (!key) return;
        acc[key] = (acc[key] ?? 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [opportunities]);

  const recentActivity = useMemo(() => {
    const userEvents = users.slice(0, 4).map((user) => ({
      id: `user_${user.id}`,
      title: `New user: ${user.name}`,
      detail: `${user.role} account created`,
      createdAt: user.createdAt
    }));

    const reportEvents = reports.slice(0, 4).map((report) => ({
      id: `report_${report.id}`,
      title: `Report ${report.status}`,
      detail: `${report.type} report by ${report.reporterId}`,
      createdAt: report.createdAt
    }));

    const auditEvents = auditLogs.slice(0, 4).map((log) => ({
      id: `audit_${log.id}`,
      title: log.action,
      detail: `${log.actorRole} · ${log.targetType}${log.targetId ? ` (${log.targetId})` : ''}`,
      createdAt: log.createdAt
    }));

    return [...auditEvents, ...reportEvents, ...userEvents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [auditLogs, reports, users]);

  if (loading) {
    return <LoadingState message="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={String(stats.totalUsers)} note={`Active: ${stats.activeUsers}`} />
        <StatCard label="Students" value={String(stats.studentCount)} />
        <StatCard label="Organizations" value={String(stats.organizationCount)} />
        <StatCard label="Open Opportunities" value={String(stats.activeOpportunities)} />
        <StatCard label="Applications" value={String(stats.totalApplications)} note={`Shortlisted: ${stats.shortlisted}`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversion" value={`${stats.conversion}%`} note="Shortlist ratio" />
        <StatCard label="Pending Reports" value={String(stats.pendingReports)} />
        <StatCard label="Pending Verifications" value={String(stats.pendingVerifications)} />
        <StatCard label="Suspended Users" value={String(stats.suspendedUsers)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">Admin Control</span>
          </div>
          <p className="text-sm text-slate-600">Run core moderation and platform operations from one place.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/admin/users">
              <Button className="w-full justify-center">Manage Users</Button>
            </Link>
            <Link href="/admin/organizations">
              <Button variant="outline" className="w-full justify-center">Review Organizations</Button>
            </Link>
            <Link href="/admin/verification">
              <Button variant="outline" className="w-full justify-center">Verification Queue</Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-center">Moderation Reports</Button>
            </Link>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Most In-Demand Skills</h2>
          {topSkills.length === 0 ? (
            <p className="text-sm text-slate-600">No opportunity data yet.</p>
          ) : (
            <div className="space-y-2">
              {topSkills.map(([skill, count]) => {
                const width = Math.max(14, Math.min(100, Math.round((count / topSkills[0][1]) * 100)));
                return (
                  <div key={skill} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-slate-800">{skill}</p>
                      <p className="text-brand-700">{count}</p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Platform Activity</h2>
          <Link href="/admin/audit-logs" className="text-sm font-semibold text-brand-700">
            View all logs
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-600">No activity available yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{activity.title}</p>
                  <p className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-slate-700">{activity.detail}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
