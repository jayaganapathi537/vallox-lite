'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Opportunity } from '@/models/vallox';
import { logAudit } from '@/services/vallox/adminOpsService';
import { deleteOpportunity, getAllOpportunities, updateOpportunity } from '@/services/vallox/opportunityService';
import { getOrganisationProfilesByIds } from '@/services/vallox/organisationService';

export default function AdminOpportunityModerationPage() {
  const { appUser } = useAppAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [orgNameById, setOrgNameById] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await getAllOpportunities();
      setOpportunities(rows);

      const orgProfiles = await getOrganisationProfilesByIds(rows.map((item) => item.orgId));
      setOrgNameById(Object.fromEntries(orgProfiles.map((org) => [org.userId, org.orgName])));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load opportunities.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return opportunities.filter((item) => statusFilter === 'all' || item.status === statusFilter);
  }, [opportunities, statusFilter]);

  const handleToggleStatus = async (opportunity: Opportunity) => {
    const nextStatus = opportunity.status === 'open' ? 'closed' : 'open';

    setSavingId(opportunity.id);
    try {
      await updateOpportunity(opportunity.id, { status: nextStatus });
      if (appUser) {
        await logAudit({
          actorId: appUser.id,
          actorRole: appUser.role,
          action: `opportunity_${nextStatus}`,
          targetType: 'opportunity',
          targetId: opportunity.id,
          details: `${opportunity.title} set to ${nextStatus}`
        });
      }
      await loadData();
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Unable to update opportunity status.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  const handleDelete = async (opportunity: Opportunity) => {
    const shouldDelete = window.confirm('Delete this opportunity?');
    if (!shouldDelete) return;

    setSavingId(opportunity.id);
    try {
      await deleteOpportunity(opportunity.id);
      if (appUser) {
        await logAudit({
          actorId: appUser.id,
          actorRole: appUser.role,
          action: 'opportunity_deleted',
          targetType: 'opportunity',
          targetId: opportunity.id,
          details: opportunity.title
        });
      }
      await loadData();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete opportunity.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading opportunity moderation..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Opportunity Moderation</h2>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | 'open' | 'closed')}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Role</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Organization</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((opportunity) => (
              <tr key={opportunity.id}>
                <td className="px-3 py-2 text-slate-900">{opportunity.title}</td>
                <td className="px-3 py-2 text-slate-700">{orgNameById[opportunity.orgId] ?? opportunity.orgId}</td>
                <td className="px-3 py-2 capitalize text-slate-700">{opportunity.type}</td>
                <td className="px-3 py-2 capitalize text-slate-700">{opportunity.status}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={savingId === opportunity.id} onClick={() => handleToggleStatus(opportunity)}>
                      {savingId === opportunity.id ? 'Saving...' : opportunity.status === 'open' ? 'Close' : 'Reopen'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={savingId === opportunity.id} onClick={() => handleDelete(opportunity)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
