'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import StatCard from '@/components/panels/StatCard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Task, TaskSubmission, TaskSubmissionStatus } from '@/models/vallox';
import { getTasksForStudent, getTaskSubmissionsByStudent, upsertTaskSubmission } from '@/services/vallox/taskService';

function statusForTask(task: Task, submissions: TaskSubmission[], studentId: string): TaskSubmissionStatus {
  const submission = submissions.find((item) => item.taskId === task.id && item.studentId === studentId);
  return submission?.status ?? 'pending';
}

export default function StudentTasksPage() {
  const { appUser } = useAppAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [activeTaskId, setActiveTaskId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [taskRows, submissionRows] = await Promise.all([
        getTasksForStudent(appUser.id),
        getTaskSubmissionsByStudent(appUser.id)
      ]);

      setTasks(taskRows);
      setSubmissions(submissionRows);
      setActiveTaskId((current) => current || taskRows[0]?.id || '');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load tasks.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeTask = useMemo(() => tasks.find((task) => task.id === activeTaskId) ?? null, [activeTaskId, tasks]);

  useEffect(() => {
    if (!activeTask || !appUser) return;

    const existing = submissions.find((item) => item.taskId === activeTask.id && item.studentId === appUser.id);
    setResponseText(existing?.responseText ?? '');
  }, [activeTask, appUser, submissions]);

  const stats = useMemo(() => {
    if (!appUser) {
      return { total: 0, completed: 0, inProgress: 0, submitted: 0, approved: 0 };
    }

    let completed = 0;
    let inProgress = 0;
    let submitted = 0;
    let approved = 0;

    tasks.forEach((task) => {
      const status = statusForTask(task, submissions, appUser.id);
      if (status === 'in_progress') inProgress += 1;
      if (status === 'submitted') submitted += 1;
      if (status === 'approved') {
        approved += 1;
        completed += 1;
      }
      if (status === 'rejected') completed += 1;
    });

    return {
      total: tasks.length,
      completed,
      inProgress,
      submitted,
      approved
    };
  }, [appUser, submissions, tasks]);

  const handleUpdateStatus = async (nextStatus: TaskSubmissionStatus) => {
    if (!appUser || !activeTask) return;

    setSaving(true);
    setStatusMessage('');

    try {
      await upsertTaskSubmission({
        taskId: activeTask.id,
        orgId: activeTask.orgId,
        studentId: appUser.id,
        status: nextStatus,
        responseText
      });
      setStatusMessage(`Task ${nextStatus.replace('_', ' ')} successfully.`);
      await loadData();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to update task submission.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading tasks..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Tasks" value={String(stats.total)} />
        <StatCard label="Completed" value={String(stats.completed)} />
        <StatCard label="In Progress" value={String(stats.inProgress)} />
        <StatCard label="Submitted" value={String(stats.submitted)} />
        <StatCard label="Approved" value={String(stats.approved)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Assigned Tasks</h2>
          {!tasks.length ? (
            <p className="text-sm text-slate-600">No tasks assigned yet.</p>
          ) : (
            tasks.map((task) => {
              const status = statusForTask(task, submissions, appUser.id);
              const active = task.id === activeTaskId;
              return (
                <button
                  key={task.id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left ${
                    active ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50'
                  }`}
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-600">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                  <p className="mt-1 text-xs capitalize text-brand-700">Status: {status}</p>
                </button>
              );
            })
          )}
        </Card>

        <Card className="space-y-4 p-4">
          {!activeTask ? (
            <p className="text-sm text-slate-600">Select a task to view details.</p>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{activeTask.title}</h2>
                <p className="text-sm text-slate-600">Type: {activeTask.taskType} · Due: {new Date(activeTask.deadline).toLocaleString()}</p>
              </div>

              <p className="text-sm text-slate-700">{activeTask.description}</p>

              <div className="flex flex-wrap gap-2">
                {activeTask.skillsTested.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>

              <Textarea
                label="Task Response"
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                placeholder="Add your solution notes, links, and submission details."
              />

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('in_progress')} disabled={saving}>
                  Start Task
                </Button>
                <Button size="sm" onClick={() => handleUpdateStatus('submitted')} disabled={saving || !responseText.trim()}>
                  Submit Task
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
