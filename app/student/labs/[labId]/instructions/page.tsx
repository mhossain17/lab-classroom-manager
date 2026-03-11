import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getStudentLabContext } from "@/lib/data";
import { splitLines } from "@/lib/utils";

export default async function LabInstructionsPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const user = await requireRole(["STUDENT"]);

  const [{ theme }, lab] = await Promise.all([getOrCreateGlobalConfig(), getStudentLabContext(user.id, labId)]);
  if (!lab) {
    notFound();
  }

  return (
    <AppShell role="student" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Start Hub</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{lab.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Use this if you missed opening instructions or need a reset.</p>
        </div>
        <Link href={`/student/labs/${lab.id}`} className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Back to Lab Flow
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Objective</CardTitle>
          <CardDescription>{lab.objective}</CardDescription>
        </Card>

        <Card>
          <CardTitle>What should I do first?</CardTitle>
          <CardDescription>{lab.whatFirst}</CardDescription>
        </Card>

        <Card className="lg:col-span-2 bg-brand-primary/10">
          <CardTitle>Start Here</CardTitle>
          <CardDescription className="text-slate-800 dark:text-slate-100">{lab.startHereContent}</CardDescription>
        </Card>

        <Card>
          <CardTitle>Quick recap of teacher instructions</CardTitle>
          <CardDescription>{lab.openingRecap}</CardDescription>
        </Card>

        <Card>
          <CardTitle>Prior knowledge reminders</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {splitLines(lab.priorKnowledge).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Common mistakes to avoid</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {splitLines(lab.commonMistakes).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Materials checklist</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {splitLines(lab.materials).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-5">
        <Card>
          <CardTitle>Step-by-step directions</CardTitle>
          <div className="mt-4 space-y-3">
            {lab.steps.map((step) => (
              <div key={step.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">Step {step.order}</p>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">{step.title}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">Expected:</span> {step.expectedResult}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
