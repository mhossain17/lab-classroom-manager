import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, Compass, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProgressUpdateForm } from "@/components/student/progress-update-form";
import { StepList } from "@/components/student/step-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getStudentLabContext } from "@/lib/data";
import { getNextStepRecommendation } from "@/lib/next-step";
import { splitLines } from "@/lib/utils";

export default async function StudentLabPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const user = await requireRole(["STUDENT"]);

  const [{ theme }, lab] = await Promise.all([getOrCreateGlobalConfig(), getStudentLabContext(user.id, labId)]);

  if (!lab) {
    notFound();
  }

  const progress = lab.progressRecords[0];
  const nextStep = getNextStepRecommendation({
    status: progress?.status,
    isStuck: progress?.isStuck,
    waitingForHelp: progress?.waitingForHelp,
    troubleshootingAttempts: progress?.troubleshootingAttempts,
    currentStepOrder: progress?.currentStep?.order,
    totalSteps: lab.steps.length
  });

  return (
    <AppShell role="student" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Current Lab</p>
          <CardTitle className="mt-1">{lab.title}</CardTitle>
          <CardDescription>{lab.objective}</CardDescription>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Materials</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                {splitLines(lab.materials).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-brand-primary/10 p-3 text-sm">
              <p className="font-semibold text-brand-primary">What should I do first?</p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{lab.whatFirst}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="accent">{lab.class.name}</Badge>
            <StatusPill status={progress?.status ?? "NOT_STARTED"} />
            {progress?.currentStep ? <Badge variant="neutral">Step {progress.currentStep.order}</Badge> : null}
          </div>
        </Card>

        <Card>
          <CardTitle>Update Your Status</CardTitle>
          <CardDescription>Keep this accurate so teacher support can be prioritized.</CardDescription>
          <div className="mt-4">
            <ProgressUpdateForm
              labId={lab.id}
              stepOptions={lab.steps.map((step) => ({ id: step.id, order: step.order, title: step.title }))}
              currentStepId={progress?.currentStepId}
              status={progress?.status}
              isStuck={progress?.isStuck}
              waitingForHelp={progress?.waitingForHelp}
              notes={progress?.notes}
            />
          </div>
        </Card>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <CardTitle>Step-by-Step Procedure</CardTitle>
              <CardDescription>Follow one step at a time, checking expected behavior before advancing.</CardDescription>
            </div>
            <Link
              href={`/student/labs/${lab.id}/instructions`}
              className="rounded-lg bg-brand-secondary px-3 py-2 text-sm font-semibold text-white"
            >
              Open Start Here
            </Link>
          </div>
          <StepList steps={lab.steps} currentStepId={progress?.currentStepId} />
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">Quick Actions</p>
            <div className="mt-3 rounded-xl bg-brand-secondary/15 p-3">
              <p className="text-sm font-semibold text-brand-primary">{nextStep.headline}</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{nextStep.action}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{nextStep.reason}</p>
            </div>
            <div className="mt-3 space-y-2">
              <Link
                href={`/student/labs/${lab.id}/help`}
                className="flex items-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
              >
                <LifeBuoy className="h-4 w-4" />
                {nextStep.shouldCallTeacher ? "Get AI Help + Notify Teacher" : "Get AI Troubleshooting Help"}
              </Link>
              <Link
                href={`/student/labs/${lab.id}/instructions`}
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Compass className="h-4 w-4" />
                Re-open Start Here Recap
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Recent Help History</CardTitle>
            </div>
            <div className="mt-3 space-y-2">
              {lab.helpRequests.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No help requests submitted for this lab yet.</p>
              ) : (
                lab.helpRequests.slice(0, 4).map((request) => (
                  <div key={request.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/70">
                    <p className="font-semibold text-slate-700 dark:text-slate-100">{request.issueSummary}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
