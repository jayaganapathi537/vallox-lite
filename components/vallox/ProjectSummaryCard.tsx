import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SdgChip from '@/components/vallox/SdgChip';
import type { Project } from '@/models/vallox';

interface ProjectSummaryCardProps {
  project: Project;
  editHref: string;
  onDelete: (projectId: string) => void;
}

export default function ProjectSummaryCard({ project, editHref, onDelete }: ProjectSummaryCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink-900">{project.title}</h3>
        <div className="flex gap-2">
          <Link href={editHref}>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => onDelete(project.id)}>
            Delete
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-600">{project.description}</p>
      <div className="flex flex-wrap gap-2">
        {project.techStack.map((skill) => (
          <span key={skill} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
            {skill}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {project.sdgTags.map((sdg) => (
          <SdgChip key={`${project.id}-${sdg}`} sdg={sdg} />
        ))}
      </div>
    </Card>
  );
}
