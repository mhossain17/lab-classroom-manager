import { HelpRequest } from "@prisma/client";
import { resolveHelpRequestAction } from "@/lib/actions/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type QueueRequest = HelpRequest & {
  student: {
    name: string;
  };
  lab: {
    title: string;
    class: {
      name: string;
      section: string;
    };
  };
  labStep: {
    order: number;
    title: string;
  } | null;
};

export function HelpQueue({ requests }: { requests: QueueRequest[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">No active requests right now.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{request.student.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {request.lab.class.name} ({request.lab.class.section}) • {request.lab.title}
              </p>
            </div>
            <form action={resolveHelpRequestAction}>
              <input type="hidden" name="helpRequestId" value={request.id} />
              <Button type="submit" size="sm" variant="secondary">
                Mark Resolved
              </Button>
            </form>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {request.labStep ? `Step ${request.labStep.order}: ${request.labStep.title}` : "Step not specified"}
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Issue: {request.issueSummary}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Tried: {request.troubleshootingAttempted}</p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(request.createdAt).toLocaleString()}</p>
        </Card>
      ))}
    </div>
  );
}
