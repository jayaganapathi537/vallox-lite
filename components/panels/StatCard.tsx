import Card from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: string;
  note?: string;
}

export default function StatCard({ label, value, note }: StatCardProps) {
  return (
    <Card className="space-y-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {note ? <p className="text-sm text-slate-600">{note}</p> : null}
    </Card>
  );
}
