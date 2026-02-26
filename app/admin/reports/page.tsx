'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { createReport, getAllReports, logAudit, updateReportStatus } from '@/services/vallox/adminOpsService';

export default function AdminReportsPage() {
  const { appUser } = useAppAuth();

  const [type, setType] = useState('fake profile');
  const [reportedUserId, setReportedUserId] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reports, setReports] = useState<Awaited<ReturnType<typeof getAllReports>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await getAllReports();
      setReports(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load reports.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!appUser) return;

    setSaving(true);
    try {
      const report = await createReport({
        reporterId: appUser.id,
        reportedUserId: reportedUserId || undefined,
        type,
        evidence
      });
      await logAudit({
        actorId: appUser.id,
        actorRole: appUser.role,
        action: 'report_created',
        targetType: 'report',
        targetId: report.id,
        details: type
      });
      setEvidence('');
      setReportedUserId('');
      await loadData();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create report.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!appUser) return;

    setSaving(true);
    try {
      await updateReportStatus(reportId, status, status === 'resolved' ? 'Resolved by admin action.' : 'Dismissed by admin after review.');
      await logAudit({
        actorId: appUser.id,
        actorRole: appUser.role,
        action: `report_${status}`,
        targetType: 'report',
        targetId: reportId
      });
      await loadData();
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : 'Unable to update report status.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading reports..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Create Moderation Report</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Type" value={type} onChange={(event) => setType(event.target.value)} />
          <Input label="Reported User ID (optional)" value={reportedUserId} onChange={(event) => setReportedUserId(event.target.value)} />
        </div>
        <Textarea label="Evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} />
        <Button size="sm" onClick={handleCreate} disabled={saving || !type.trim() || !evidence.trim()}>
          {saving ? 'Saving...' : 'Create Report'}
        </Button>
      </Card>

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 capitalize">{report.type}</p>
                <p className="text-xs text-slate-500">Created: {new Date(report.createdAt).toLocaleString()}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                report.status === 'resolved'
                  ? 'bg-brand-100 text-brand-700'
                  : report.status === 'dismissed'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {report.status}
              </span>
            </div>
            <p className="text-sm text-slate-700">{report.evidence}</p>
            {report.status === 'pending' ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleStatus(report.id, 'resolved')} disabled={saving}>Resolve</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatus(report.id, 'dismissed')} disabled={saving}>Dismiss</Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
