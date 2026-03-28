import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LabReportWorkspaceForm } from "@/components/student/lab-report-workspace-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getStudentLabReportWorkspace } from "@/lib/data";
import { splitLines } from "@/lib/utils";

export default async function StudentLabReportWorkspacePage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const user = await requireRole(["STUDENT"]);

  const [{ theme }, lab] = await Promise.all([
    getOrCreateGlobalConfig(),
    getStudentLabReportWorkspace(user.id, labId)
  ]);

  if (!lab) {
    notFound();
  }

  const work = lab.studentWork[0] ?? null;

  return (
    <AppShell role="student" userName={user.name} schoolName={theme.schoolName} logoUrl={theme.logoUrl}>
      <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Lab Report Workspace</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{lab.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Capture your work as you go, then download everything for final report submission.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/student/labs/${lab.id}`} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Back to Lab
          </Link>
          <a
            href={`/student/labs/${lab.id}/report/download`}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Download My Lab Work
          </a>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LabReportWorkspaceForm labId={lab.id} existingWork={work} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Teacher Packet</CardTitle>
            {!lab.packet ? (
              <CardDescription>No packet has been published yet for this lab.</CardDescription>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Due Date:</span>{" "}
                  {lab.packet.dueDate ? new Date(lab.packet.dueDate).toLocaleDateString() : "Not set"}
                </p>

                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Objective</p>
                  <p className="text-slate-600 dark:text-slate-300">{lab.packet.objective}</p>
                </div>

                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Pre-Lab Questions</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    {splitLines(lab.packet.preLabQuestions).map((line) => (
                      <li key={line}>{line.replace(/^-\s*/, "")}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Helpful Tips</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    {splitLines(lab.packet.helpfulTips).map((line) => (
                      <li key={line}>{line.replace(/^-\s*/, "")}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Schematic Preview (Mermaid)</CardTitle>
            {work?.schematicDiagram ? (
              <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{work.schematicDiagram}</pre>
            ) : (
              <CardDescription>
                Add components and connections in the form to auto-generate schematic text for your report.
              </CardDescription>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
