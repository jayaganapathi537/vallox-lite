import Card from '@/components/ui/Card';

interface FeatureListCardProps {
  title: string;
  items: string[];
  accent?: string;
}

export default function FeatureListCard({ title, items, accent = 'bg-brand-50 text-brand-700' }: FeatureListCardProps) {
  return (
    <Card className="space-y-3 p-4">
      <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accent}`}>{title}</p>
      <ul className="space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
