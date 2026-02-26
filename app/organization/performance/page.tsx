'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import StatCard from '@/components/panels/StatCard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import { getTasksByOrg, getTaskSubmissionsByTask } from '@/services/vallox/taskService';
import { getUsersByIds } from '@/services/vallox/userService';

export default function OrganizationPerformancePage() {
  const { appUser } = useAppAuth();

  const [applications, setApplications] = useState<Awaited<ReturnType<typeof getApplicationsByOrg>>>([]);
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof getTasksByOrg>>>([]);
  const [submissions, setSubmissions] = useState<Awaited<ReturnType<typeof getTaskSubmissionsByTask>>>([]);
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [applicationRows, taskRows] = await Promise.all([
        getApplicationsByOrg(appUser.id),
        getTasksByOrg(appUser.id)
      ]);

      setApplications(applicationRows);
      setTasks(taskRows);

      const submissionGroups = await Promise.all(taskRows.map((task) => getTaskSubmissionsByTask(task.id)));
      const allSubmissions = submissionGroups.flat();
      setSubmissions(allSubmissions);

      const users = await getUsersByIds([...new Set(applicationRows.map((item) => item.studentId))]);
      setStudentNameById(Object.fromEntries(users.map((user) => [user.id, user.name])));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load performance data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const reviewedCandidates = new Set(applications.map((item) => item.studentId)).size;
    const shortlisted = applications.filter((item) => item.status === 'shortlisted').length;
    const contacted = applications.filter((item) => item.status === 'contacted').length;

    const scored = submissions.filter((item) => typeof item.score === 'number');
    const avgTaskScore = scored.length
      ? Math.round(scored.reduce((acc, item) => acc + (item.score ?? 0), 0) / scored.length)
      : 0;

    const approvedSubmissions = submissions.filter((item) => item.status === 'approved').length;

    return {
      reviewedCandidates,
      shortlisted,
      contacted,
      avgTaskScore,
      approvedSubmissions
    };
  }, [applications, submissions]);

  const topPerformers = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();

    submissions.forEach((submission) => {
      if (typeof submission.score !== 'number') return;

      const current = map.get(submission.studentId) ?? { total: 0, count: 0 };
      map.set(submission.studentId, {
        total: current.total + submission.score,
        count: current.count + 1
      });
    });

    return [...map.entries()]
      .map(([studentId, value]) => ({
        studentId,
        average: Math.round(value.total / value.count),
        count: value.count
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 8);
  }, [submissions]);

  if (loading || !appUser) {
    return <LoadingState message="Loading candidate performance..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Candidates Reviewed" value={String(summary.reviewedCandidates)} />
        <StatCard label="Shortlisted" value={String(summary.shortlisted)} />
        <StatCard label="Contacted" value={String(summary.contacted)} />
        <StatCard label="Avg Task Score" value={String(summary.avgTaskScore)} />
        <StatCard label="Approved Submissions" value={String(summary.approvedSubmissions)} />
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Top Candidate Performance</h2>
        {!topPerformers.length ? (
          <p className="text-sm text-slate-600">No scored submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Candidate</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Average Score</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Tasks Scored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {topPerformers.map((item) => (
                  <tr key={item.studentId}>
                    <td className="px-3 py-2 text-slate-900">{studentNameById[item.studentId] ?? item.studentId}</td>
                    <td className="px-3 py-2 text-slate-700">{item.average}</td>
                    <td className="px-3 py-2 text-slate-700">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
