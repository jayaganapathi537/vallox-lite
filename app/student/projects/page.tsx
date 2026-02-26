'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import StatCard from '@/components/panels/StatCard';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Project } from '@/models/vallox';
import { deleteProject, getProjectsByStudentId } from '@/services/vallox/projectService';

type SortOption = 'newest' | 'oldest' | 'title';
type FilterOption = 'all' | 'verified' | 'draft' | 'published';

function isVerified(project: Project) {
  return Boolean(project.links.github && project.links.demo);
}

function isDraft(project: Project) {
  return !(project.description.trim().length > 20 && project.techStack.length > 1);
}

function projectStatus(project: Project): 'verified' | 'draft' | 'published' {
  if (isVerified(project)) return 'verified';
  if (isDraft(project)) return 'draft';
  return 'published';
}

function projectScore(project: Project) {
  const parts = [
    project.title.trim().length > 2,
    project.description.trim().length > 30,
    project.techStack.length > 1,
    Boolean(project.links.github),
    Boolean(project.links.demo),
    ].filter(Boolean).length;
  return Math.round((parts / 5) * 100);
}

export default function StudentProjectsPage() {
  const { appUser } = useAppAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const rows = await getProjectsByStudentId(appUser.id);
      setProjects(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load projects.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredAndSorted = useMemo(() => {
    const filtered = projects.filter((project) => {
      const status = projectStatus(project);
      if (filterBy === 'all') return true;
      return status === filterBy;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      return a.title.localeCompare(b.title);
    });
  }, [filterBy, projects, sortBy]);

  const stats = useMemo(() => {
    const verified = projects.filter((item) => projectStatus(item) === 'verified').length;
    const draft = projects.filter((item) => projectStatus(item) === 'draft').length;
    return {
      total: projects.length,
      verified,
      draft
    };
  }, [projects]);

  const handleDelete = async (projectId: string) => {
    const shouldDelete = window.confirm('Delete this project? This action cannot be undone.');
    if (!shouldDelete) return;

    await deleteProject(projectId);
    await loadProjects();
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading projects..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Projects" value={String(stats.total)} />
        <StatCard label="Verified Projects" value={String(stats.verified)} />
        <StatCard label="Draft Projects" value={String(stats.draft)} />
        <StatCard label="Listed Projects" value={String(filteredAndSorted.length)} note="Current filter" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">My Projects</h2>
            <p className="text-sm text-slate-600">Create, edit, and publish proof-of-work projects with real links.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new">
              <Button size="sm">Add New Project</Button>
            </Link>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="title">Sort: Title</option>
            </select>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={filterBy}
              onChange={(event) => setFilterBy(event.target.value as FilterOption)}
            >
              <option value="all">Filter: All</option>
              <option value="verified">Filter: Verified</option>
              <option value="published">Filter: Published</option>
              <option value="draft">Filter: Draft</option>
            </select>
          </div>
        </div>
      </Card>

      {!filteredAndSorted.length ? (
        <Card>
          <p className="text-sm text-slate-600">No projects found for this filter.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredAndSorted.map((project) => {
            const status = projectStatus(project);
            const score = projectScore(project);

            return (
              <Card key={project.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                    <p className="text-sm text-slate-600">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">{status}</span>
                </div>

                <p className="text-sm text-slate-600">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Completeness Score: {score}%</p>
                  <p>GitHub: {project.links.github ? 'Attached' : 'Missing'}</p>
                  <p>Demo: {project.links.demo ? 'Attached' : 'Missing'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(project.id)}>
                    Delete
                  </Button>
                  <Link href={`/students/${appUser.id}`}>
                    <Button size="sm" variant="outline">
                      Preview Public View
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
