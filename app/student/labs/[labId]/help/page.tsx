import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AiHelpForm } from "@/components/student/ai-help-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getStudentLabContext } from "@/lib/data";

export default async function LabHelpPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const user = await requireRole(["STUDENT"]);

  const [{ theme }, lab] = await Promise.all([getOrCreateGlobalConfig(), getStudentLabContext(user.id, labId)]);
  if (!lab) {
    notFound();
  }

  const progress = lab.progressRecords[0];

  return (
    <AppShell role="student" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">AI Lab Assistant</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{lab.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Guided troubleshooting that builds diagnostic thinking before escalation.
          </p>
        </div>
        <Link href={`/student/labs/${lab.id}`} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Back to Lab
        </Link>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AiHelpForm
            labId={lab.id}
            steps={lab.steps.map((step) => ({ id: step.id, order: step.order, title: step.title }))}
            selectedStepId={progress?.currentStepId}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Troubleshooting checkpoints</CardTitle>
            <CardDescription>Use these checks before changing your circuit or logic design.</CardDescription>
            <div className="mt-3 space-y-2 text-sm">
              {lab.checkpoints.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-300">No checkpoints defined yet.</p>
              ) : (
                lab.checkpoints.slice(0, 8).map((checkpoint) => (
                  <div key={checkpoint.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{checkpoint.title}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{checkpoint.checkpointQuestion}</p>
                    {checkpoint.step ? (
                      <Badge variant="neutral" className="mt-2">
                        Step {checkpoint.step.order}
                      </Badge>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Recent requests</CardTitle>
            <div className="mt-3 space-y-2">
              {lab.helpRequests.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No requests yet for this lab.</p>
              ) : (
                lab.helpRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{request.issueSummary}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {request.resolved ? "Resolved" : "Open"} • {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
