'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import type { AccountStatus, BaseUser, OrganisationProfile } from '@/models/vallox';
import { logAudit } from '@/services/vallox/adminOpsService';
import { getAllOrganisationProfiles } from '@/services/vallox/organisationService';
import { getAllUsers, updateUser } from '@/services/vallox/userService';
import { useAppAuth } from '@/lib/useAppAuth';

export default function AdminOrganizationsPage() {
  const { appUser } = useAppAuth();

  const [profiles, setProfiles] = useState<OrganisationProfile[]>([]);
  const [usersById, setUsersById] = useState<Record<string, BaseUser>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [orgProfiles, users] = await Promise.all([getAllOrganisationProfiles(), getAllUsers()]);
      setProfiles(orgProfiles);
      setUsersById(Object.fromEntries(users.map((user) => [user.id, user])));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load organizations.';
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

  const handleToggle = async (profile: OrganisationProfile) => {
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
          action: `organization_${nextStatus}`,
          targetType: 'organization',
          targetId: profile.userId,
          details: `${profile.orgName} set to ${nextStatus}`
        });
      }
      await loadData();
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Unable to update organization status.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading organization management..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Organization Management</h2>
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
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Organization</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Website</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((profile) => {
              const user = usersById[profile.userId];
              return (
                <tr key={profile.userId}>
                  <td className="px-3 py-2 text-slate-900">{profile.orgName}</td>
                  <td className="px-3 py-2 capitalize text-slate-700">{profile.type}</td>
                  <td className="px-3 py-2 capitalize text-slate-700">{user?.status ?? 'active'}</td>
                  <td className="px-3 py-2 text-slate-700">{profile.website || '-'}</td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" disabled={savingId === profile.userId} onClick={() => handleToggle(profile)}>
                      {savingId === profile.userId ? 'Saving...' : (user?.status ?? 'active') === 'suspended' ? 'Activate' : 'Suspend'}
                    </Button>
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
