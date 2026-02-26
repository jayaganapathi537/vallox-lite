import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SdgChip from '@/components/vallox/SdgChip';
import type { Opportunity } from '@/models/vallox';

interface OpportunitySummaryCardProps {
  opportunity: Opportunity;
  orgName?: string;
  matchScore?: number;
  detailHref: string;
}

export default function OpportunitySummaryCard({
  opportunity,
  orgName,
  matchScore,
  detailHref
}: OpportunitySummaryCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ink-900">{opportunity.title}</h3>
          <p className="text-sm text-ink-500">
            {orgName ? `${orgName} • ` : ''}
            {opportunity.type} • {opportunity.isRemote ? 'Remote' : opportunity.location}
          </p>
        </div>
        {typeof matchScore === 'number' ? (
          <span className="rounded-full bg-sea-50 px-3 py-1 text-xs font-semibold text-sea-700">{matchScore}% match</span>
        ) : null}
      </div>

      <p className="text-sm text-ink-600">{opportunity.description}</p>

      <div className="flex flex-wrap gap-2">
        {opportunity.requiredSkills.map((skill) => (
          <span key={skill} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {opportunity.sdgTags.map((sdg) => (
          <SdgChip key={`${opportunity.id}-${sdg}`} sdg={sdg} />
        ))}
      </div>

      <Link href={detailHref}>
        <Button variant="outline" size="sm">
          View details
        </Button>
      </Link>
    </Card>
  );
}
