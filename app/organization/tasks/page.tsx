'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, Opportunity, Task, TaskSubmission, TaskSubmissionStatus, TaskType } from '@/models/vallox';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import { getOpportunitiesByOrgId } from '@/services/vallox/opportunityService';
import { createTask, getTaskSubmissionsByTask, getTasksByOrg, updateTaskSubmission } from '@/services/vallox/taskService';
import { getUsersByIds } from '@/services/vallox/userService';

const taskTypes: TaskType[] = ['coding', 'quiz', 'file', 'case-study'];

export default function OrganizationTasksPage() {
  const { appUser } = useAppAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [deadline, setDeadline] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('coding');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'all_applicants' | 'shortlisted'>('all_applicants');

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissionsByTaskId, setSubmissionsByTaskId] = useState<Record<string, TaskSubmission[]>>({});
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});

  const [activeTaskId, setActiveTaskId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [opportunityRows, applicationRows, taskRows] = await Promise.all([
        getOpportunitiesByOrgId(appUser.id),
        getApplicationsByOrg(appUser.id),
        getTasksByOrg(appUser.id)
      ]);

      setOpportunities(opportunityRows);
      setApplications(applicationRows);
      setTasks(taskRows);
      setSelectedOpportunityId((current) => current || opportunityRows[0]?.id || '');
      setActiveTaskId((current) => current || taskRows[0]?.id || '');

      const submissionRows = await Promise.all(taskRows.map((task) => getTaskSubmissionsByTask(task.id)));
      const submissionMap = Object.fromEntries(taskRows.map((task, index) => [task.id, submissionRows[index]]));
      setSubmissionsByTaskId(submissionMap);

      const allStudentIds = [...new Set(applicationRows.map((application) => application.studentId))];
      const users = await getUsersByIds(allStudentIds);
      setStudentNameById(Object.fromEntries(users.map((user) => [user.id, user.name])));
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

  const assignedStudents = useMemo(() => {
    const relevantApplications = applications.filter((application) => application.opportunityId === selectedOpportunityId);

    if (assignmentMode === 'shortlisted') {
      return [...new Set(relevantApplications.filter((item) => item.status === 'shortlisted').map((item) => item.studentId))];
    }

    return [...new Set(relevantApplications.map((item) => item.studentId))];
  }, [applications, assignmentMode, selectedOpportunityId]);

  const handleCreateTask = async () => {
    if (!appUser || !selectedOpportunityId) return;

    setSaving(true);
    setError('');
    setStatusMessage('');

    try {
      const skillArray = skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      await createTask(appUser.id, {
        title,
        description,
        taskType,
        skillsTested: skillArray,
        deadline,
        studentIds: assignedStudents,
        opportunityId: selectedOpportunityId
      });

      setTitle('');
      setDescription('');
      setSkills('');
      setDeadline('');
      setStatusMessage('Task created and assigned successfully.');
      await loadData();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create task.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (submission: TaskSubmission, nextStatus: TaskSubmissionStatus) => {
    setSaving(true);
    try {
      await updateTaskSubmission({
        taskId: submission.taskId,
        studentId: submission.studentId,
        status: nextStatus
      });
      await loadData();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update submission status.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading task management..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Create Task</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Task Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input label="Deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Task Type</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={taskType} onChange={(event) => setTaskType(event.target.value as TaskType)}>
              {taskTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Opportunity</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={selectedOpportunityId}
              onChange={(event) => setSelectedOpportunityId(event.target.value)}
            >
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Assign To</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={assignmentMode}
              onChange={(event) => setAssignmentMode(event.target.value as 'all_applicants' | 'shortlisted')}
            >
              <option value="all_applicants">All Applicants</option>
              <option value="shortlisted">Shortlisted Only</option>
            </select>
          </div>
          <Input label="Skills Tested (comma separated)" value={skills} onChange={(event) => setSkills(event.target.value)} />
        </div>

        <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />

        <p className="text-xs text-slate-500">This task will be assigned to {assignedStudents.length} student(s).</p>

        <Button size="sm" onClick={handleCreateTask} disabled={saving || !title || !description || !deadline || !selectedOpportunityId}>
          {saving ? 'Creating...' : 'Create Task'}
        </Button>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-slate-900">My Tasks</h2>
          {!tasks.length ? (
            <p className="text-sm text-slate-600">No tasks created yet.</p>
          ) : (
            tasks.map((task) => {
              const submissions = submissionsByTaskId[task.id] ?? [];
              const active = task.id === activeTaskId;
              return (
                <button
                  key={task.id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left ${active ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50'}`}
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <p className="font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-600">Assigned: {task.studentIds.length} · Submissions: {submissions.length}</p>
                </button>
              );
            })
          )}
        </Card>

        <Card className="space-y-3 p-4">
          {!activeTask ? (
            <p className="text-sm text-slate-600">Select a task to review submissions.</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900">{activeTask.title}</h2>
              <p className="text-sm text-slate-600">{activeTask.description}</p>

              <div className="space-y-2">
                {(submissionsByTaskId[activeTask.id] ?? []).length === 0 ? (
                  <p className="text-sm text-slate-600">No submissions yet.</p>
                ) : (
                  (submissionsByTaskId[activeTask.id] ?? []).map((submission) => (
                    <div key={submission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-semibold text-slate-900">{studentNameById[submission.studentId] ?? submission.studentId}</p>
                      <p className="text-xs capitalize text-slate-600">Status: {submission.status}</p>
                      {submission.responseText ? <p className="mt-2 text-sm text-slate-700">{submission.responseText}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => handleReview(submission, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={saving} onClick={() => handleReview(submission, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
