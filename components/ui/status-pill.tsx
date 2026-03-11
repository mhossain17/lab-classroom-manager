import { ProgressStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS_COPY: Record<ProgressStatus, { label: string; variant: "neutral" | "success" | "warning" | "danger" | "accent" }> = {
  NOT_STARTED: { label: "Not Started", variant: "neutral" },
  STARTED: { label: "Started", variant: "accent" },
  IN_PROGRESS: { label: "In Progress", variant: "accent" },
  STUCK: { label: "Stuck", variant: "warning" },
  WAITING_FOR_HELP: { label: "Waiting for Teacher", variant: "danger" },
  COMPLETED: { label: "Completed", variant: "success" }
};

export function StatusPill({ status }: { status: ProgressStatus }) {
  const info = STATUS_COPY[status];
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
