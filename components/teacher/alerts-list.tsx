import { AlertSeverity, AlertType, TeacherAlert } from "@prisma/client";
import { dismissAlertAction } from "@/lib/actions/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const typeLabels: Record<AlertType, string> = {
  WAITING_TOO_LONG: "Waiting Too Long",
  REPEATED_STUCK: "Repeatedly Stuck",
  LOW_CONFIDENCE_AI: "Low Confidence AI",
  BOTTLENECK_STEP: "Class Bottleneck",
  DIRECT_HELP_REQUEST: "Direct Help Request"
};

function severityVariant(severity: AlertSeverity): "neutral" | "warning" | "danger" {
  if (severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "neutral";
}

export function AlertsList({ alerts }: { alerts: TeacherAlert[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">No active alerts.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
              <Badge variant="neutral">{typeLabels[alert.type]}</Badge>
            </div>
            <form action={dismissAlertAction}>
              <input type="hidden" name="alertId" value={alert.id} />
              <Button type="submit" size="sm" variant="ghost">
                Dismiss
              </Button>
            </form>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{alert.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(alert.createdAt).toLocaleString()}</p>
        </Card>
      ))}
    </div>
  );
}
