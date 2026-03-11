import { ActivityLog, ActivityType } from "@prisma/client";
import { Card } from "@/components/ui/card";

type ActivityRow = ActivityLog & {
  user: {
    name: string;
  };
  class: {
    name: string;
    section: string;
  } | null;
  lab: {
    title: string;
  } | null;
};

const labels: Record<ActivityType, string> = {
  VIEWED_LAB: "Viewed lab",
  UPDATED_PROGRESS: "Updated progress",
  SUBMITTED_HELP_REQUEST: "Requested help",
  RECEIVED_AI_GUIDANCE: "Received AI guidance",
  RESOLVED_HELP_REQUEST: "Help resolved"
};

export function RecentActivity({ items }: { items: ActivityRow[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">No recent activity yet.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
      <div className="space-y-3">
        {items.slice(0, 10).map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {item.user.name} • {labels[item.type]}
            </p>
            <p className="text-slate-600 dark:text-slate-300">{item.details}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {item.class ? `${item.class.name} (${item.class.section})` : "Class not set"}
              {item.lab ? ` • ${item.lab.title}` : ""} • {new Date(item.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
