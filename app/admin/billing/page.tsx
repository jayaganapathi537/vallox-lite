'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { addBillingRecord, getBillingRecords, logAudit } from '@/services/vallox/adminOpsService';
import { getAllOrganisationProfiles } from '@/services/vallox/organisationService';

export default function AdminBillingPage() {
  const { appUser } = useAppAuth();

  const [orgId, setOrgId] = useState('');
  const [planName, setPlanName] = useState('Pro');
  const [amount, setAmount] = useState(0);
  const [cycle, setCycle] = useState('monthly');
  const [status, setStatus] = useState<'paid' | 'pending' | 'refunded'>('paid');

  const [orgProfiles, setOrgProfiles] = useState<Awaited<ReturnType<typeof getAllOrganisationProfiles>>>([]);
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getBillingRecords>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [organizations, billingRows] = await Promise.all([
        getAllOrganisationProfiles(),
        getBillingRecords()
      ]);

      setOrgProfiles(organizations);
      setRecords(billingRows);
      setOrgId((current) => current || organizations[0]?.userId || '');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load billing data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalRevenue = useMemo(() => {
    return records
      .filter((record) => record.status === 'paid')
      .reduce((acc, record) => acc + record.amount, 0);
  }, [records]);

  const handleAdd = async () => {
    if (!appUser || !orgId) return;

    setSaving(true);
    setError('');

    try {
      const billingRecord = await addBillingRecord({
        orgId,
        planName,
        amount,
        cycle,
        status
      });

      await logAudit({
        actorId: appUser.id,
        actorRole: appUser.role,
        action: 'billing_record_created',
        targetType: 'billing',
        targetId: billingRecord.id,
        details: `${planName} ${amount}`
      });

      setAmount(0);
      await loadData();
    } catch (addError) {
      const message = addError instanceof Error ? addError.message : 'Unable to add billing record.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading billing..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Add Billing Record</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Organization</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={orgId} onChange={(event) => setOrgId(event.target.value)}>
              {orgProfiles.map((profile) => (
                <option key={profile.userId} value={profile.userId}>{profile.orgName}</option>
              ))}
            </select>
          </div>
          <Input label="Plan" value={planName} onChange={(event) => setPlanName(event.target.value)} />
          <Input label="Amount" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Cycle" value={cycle} onChange={(event) => setCycle(event.target.value)} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as 'paid' | 'pending' | 'refunded')}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <Button size="sm" onClick={handleAdd} disabled={saving || !orgId || !planName || amount <= 0}>
          {saving ? 'Saving...' : 'Add Record'}
        </Button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Paid Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">${totalRevenue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Records</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{records.length}</p>
        </Card>
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Billing History</h2>
        {!records.length ? (
          <p className="text-sm text-slate-600">No billing records yet.</p>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div key={record.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {(orgProfiles.find((profile) => profile.userId === record.orgId)?.orgName ?? record.orgId)} · {record.planName}
                  </p>
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">
                    {record.status}
                  </span>
                </div>
                <p className="text-slate-700">${record.amount} · {record.cycle} · {new Date(record.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
