'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { AccountStatus, BaseUser, StudentProfile } from '@/models/vallox';
import { logAudit } from '@/services/vallox/adminOpsService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';
import { getAllUsers, updateUser } from '@/services/vallox/userService';

export default function AdminStudentsPage() {
  const { appUser } = useAppAuth();

  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [usersById, setUsersById] = useState<Record<string, BaseUser>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [studentProfiles, users] = await Promise.all([getAllStudentProfiles(), getAllUsers()]);
      setProfiles(studentProfiles);
      setUsersById(Object.fromEntries(users.map((user) => [user.id, user])));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load students.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return profiles.filter((profile) => {
      const status = usersById[profile.userId]?.status ?? 'active';
      return statusFilter === 'all' || status === statusFilter;
    });
  }, [profiles, statusFilter, usersById]);

  const handleToggle = async (profile: StudentProfile) => {
    const user = usersById[profile.userId];
    if (!user) return;

    const nextStatus: AccountStatus = (user.status ?? 'active') === 'suspended' ? 'active' : 'suspended';

    setSavingId(profile.userId);
    try {
      await updateUser(profile.userId, { status: nextStatus });
      if (appUser) {
        await logAudit({
          actorId: appUser.id,
          actorRole: appUser.role,
          action: `student_${nextStatus}`,
          targetType: 'student',
          targetId: profile.userId,
          details: `${user.name} set to ${nextStatus}`
        });
      }
      await loadData();
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Unable to update student status.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading student management..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Student Management</h2>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | AccountStatus)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Headline</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Skills</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((profile) => {
              const user = usersById[profile.userId];
              return (
                <tr key={profile.userId}>
                  <td className="px-3 py-2 text-slate-900">{user?.name ?? profile.userId}</td>
                  <td className="px-3 py-2 text-slate-700">{profile.headline}</td>
                  <td className="px-3 py-2 text-slate-700">{profile.skills.slice(0, 3).join(', ') || '-'}</td>
                  <td className="px-3 py-2 capitalize text-slate-700">{user?.status ?? 'active'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/students/${profile.userId}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      <Button size="sm" variant="outline" disabled={savingId === profile.userId} onClick={() => handleToggle(profile)}>
                        {savingId === profile.userId ? 'Saving...' : (user?.status ?? 'active') === 'suspended' ? 'Activate' : 'Suspend'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
