'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import type { AccountStatus, BaseUser, UserRole } from '@/models/vallox';
import { getAllUsers, updateUser } from '@/services/vallox/userService';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<BaseUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await getAllUsers();
      setUsers(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load users.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const rolePass = roleFilter === 'all' || user.role === roleFilter;
      const statusPass = statusFilter === 'all' || (user.status ?? 'active') === statusFilter;
      return rolePass && statusPass;
    });
  }, [roleFilter, statusFilter, users]);

  const handleToggleStatus = async (user: BaseUser) => {
    setSavingId(user.id);
    try {
      const nextStatus: AccountStatus = (user.status ?? 'active') === 'suspended' ? 'active' : 'suspended';
      await updateUser(user.id, { status: nextStatus });
      await loadUsers();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update user status.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading users..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)}
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="organisation">Organization</option>
            <option value="admin">Admin</option>
          </select>

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
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Login</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-700">{user.email}</td>
                <td className="px-4 py-3 capitalize text-slate-700">{user.role}</td>
                <td className="px-4 py-3 capitalize text-slate-700">{user.status ?? 'active'}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-700">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" disabled={savingId === user.id} onClick={() => handleToggleStatus(user)}>
                    {savingId === user.id ? 'Saving...' : (user.status ?? 'active') === 'suspended' ? 'Activate' : 'Suspend'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
