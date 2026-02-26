'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import StatCard from '@/components/panels/StatCard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { getAllApplications } from '@/services/vallox/applicationService';
import { getAllOpportunities } from '@/services/vallox/opportunityService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';
import { getAllUsers } from '@/services/vallox/userService';

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<Awaited<ReturnType<typeof getAllUsers>>>([]);
  const [opportunities, setOpportunities] = useState<Awaited<ReturnType<typeof getAllOpportunities>>>([]);
  const [applications, setApplications] = useState<Awaited<ReturnType<typeof getAllApplications>>>([]);
  const [studentProfiles, setStudentProfiles] = useState<Awaited<ReturnType<typeof getAllStudentProfiles>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [allUsers, allOpportunities, allApplications, allProfiles] = await Promise.all([
        getAllUsers(),
        getAllOpportunities(),
        getAllApplications(),
        getAllStudentProfiles()
      ]);

      setUsers(allUsers);
      setOpportunities(allOpportunities);
      setApplications(allApplications);
      setStudentProfiles(allProfiles);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load analytics.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const activeUsers = users.filter((item) => (item.status ?? 'active') === 'active').length;
    const openOpportunities = opportunities.filter((item) => item.status === 'open').length;
    const shortlisted = applications.filter((item) => item.status === 'shortlisted').length;
    const conversion = applications.length ? Math.round((shortlisted / applications.length) * 100) : 0;

    const skillDemandMap = new Map<string, number>();
    opportunities.forEach((opportunity) => {
      opportunity.requiredSkills.forEach((skill) => {
        skillDemandMap.set(skill, (skillDemandMap.get(skill) ?? 0) + 1);
      });
    });

    const topSkills = [...skillDemandMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const profileSkillMap = new Map<string, number>();
    studentProfiles.forEach((profile) => {
      profile.skills.forEach((skill) => {
        profileSkillMap.set(skill, (profileSkillMap.get(skill) ?? 0) + 1);
      });
    });

    const topStudentSkills = [...profileSkillMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      activeUsers,
      openOpportunities,
      totalApplications: applications.length,
      conversion,
      topSkills,
      topStudentSkills
    };
  }, [applications, opportunities, studentProfiles, users]);

  if (loading) {
    return <LoadingState message="Loading analytics..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Users" value={String(metrics.activeUsers)} />
        <StatCard label="Open Opportunities" value={String(metrics.openOpportunities)} />
        <StatCard label="Applications" value={String(metrics.totalApplications)} />
        <StatCard label="Shortlist Conversion" value={`${metrics.conversion}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Most In-Demand Skills</h2>
          {!metrics.topSkills.length ? (
            <p className="text-sm text-slate-600">No skill demand data yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-800">{skill}</span>
                  <span className="font-semibold text-brand-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Top Student Skill Coverage</h2>
          {!metrics.topStudentSkills.length ? (
            <p className="text-sm text-slate-600">No student skill data yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topStudentSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-800">{skill}</span>
                  <span className="font-semibold text-brand-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
