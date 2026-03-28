import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LabPacketBuilderForm } from "@/components/teacher/lab-packet-builder-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getOrCreateGlobalConfig, getTeacherLabPacketContext } from "@/lib/data";
import { splitLines } from "@/lib/utils";

export default async function TeacherLabPacketBuilderPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const user = await requireRole(["TEACHER", "ADMIN"]);

  const [{ theme }, lab] = await Promise.all([
    getOrCreateGlobalConfig(),
    getTeacherLabPacketContext(user.id, labId, user.role === "ADMIN")
  ]);

  if (!lab) {
    notFound();
  }

  return (
    <AppShell
      role="teacher"
      userName={user.name}
      schoolName={theme.schoolName}
      logoUrl={theme.logoUrl}
      isAdmin={user.role === "ADMIN"}
    >
      <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">AI Lab Packet Builder</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{lab.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Generate standards-aligned objectives, procedures, pre-lab questions, data sheets, report guidance, due date, and rubric.
          </p>
        </div>
        <Link href="/teacher/labs" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
          Back to Labs
        </Link>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <LabPacketBuilderForm labId={lab.id} existingPacket={lab.packet} />

        <Card>
          <CardTitle>Standards + Student Packet Preview</CardTitle>
          <CardDescription>
            Generated content appears here and is shown to students in their report workspace.
          </CardDescription>

          {!lab.packet ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No packet generated yet.</p>
          ) : (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Due date</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {lab.packet.dueDate ? new Date(lab.packet.dueDate).toLocaleDateString() : "Not set"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Standards Alignment</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                  {splitLines(lab.packet.standardsAlignment).map((line) => (
                    <li key={line}>{line.replace(/^-\s*/, "")}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Objective</p>
                <p className="text-slate-600 dark:text-slate-300">{lab.packet.objective}</p>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Rubric</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                  {splitLines(lab.packet.rubric).map((line) => (
                    <li key={line}>{line.replace(/^-\s*/, "")}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      </section>
    </AppShell>
  );
}
