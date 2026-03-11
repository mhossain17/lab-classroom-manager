import { Card } from "@/components/ui/card";

type StepBucket = {
  label: string;
  count: number;
  stuckCount: number;
  labTitle: string;
};

export function StepDistribution({ buckets }: { buckets: StepBucket[] }) {
  if (buckets.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">No student progress data yet.</p>
      </Card>
    );
  }

  const maxCount = Math.max(...buckets.map((b) => b.count));

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Students by Current Step</h3>
      <div className="space-y-3">
        {buckets.slice(0, 10).map((bucket) => (
          <div key={`${bucket.labTitle}-${bucket.label}`}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <p>{bucket.labTitle} • {bucket.label}</p>
              <p>
                {bucket.count} students{bucket.stuckCount > 0 ? ` • ${bucket.stuckCount} stuck` : ""}
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                style={{ width: `${Math.max(8, (bucket.count / maxCount) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
