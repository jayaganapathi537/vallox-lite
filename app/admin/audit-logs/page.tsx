'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { getAuditLogs } from '@/services/vallox/adminOpsService';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof getAuditLogs>>>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await getAuditLogs();
      setLogs(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load audit logs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      const text = `${log.action} ${log.targetType} ${log.actorId} ${log.details ?? ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [logs, query]);

  if (loading) {
    return <LoadingState message="Loading audit logs..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
        <Input label="Search Logs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="action, target, actor" />
      </Card>

      <Card className="space-y-3 p-4">
        {!filtered.length ? (
          <p className="text-sm text-slate-600">No logs found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-slate-700">Actor: {log.actorRole} · {log.actorId}</p>
                <p className="text-slate-700">Target: {log.targetType}{log.targetId ? ` · ${log.targetId}` : ''}</p>
                {log.details ? <p className="text-slate-600">{log.details}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
